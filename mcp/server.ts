import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { SerializableParameterSchema } from '../src/schema-serializer.js';
import { WorkflowEngine } from '../src/engine.js';

interface NodeSummary {
  nodeType: string;
  name: string;
  purpose: string;
  useCases: string[];
  parameterSchema: SerializableParameterSchema;
}

const engine = new WorkflowEngine();

const server = new McpServer(
  {
    name: 'workflow-mng',
    version: '1.0.0',
  },
  {
    instructions:
      'Use list-available-nodes to inspect every workflow node that can be used right now.',
  },
);

function getAvailableNodeSummaries(): NodeSummary[] {
  return engine.getRegisteredNodePlugins().map((plugin) => ({
    nodeType: plugin.nodeType,
    name: plugin.name,
    purpose: plugin.purpose,
    useCases: plugin.useCases,
    parameterSchema: plugin.getParameterSchema(),
  }));
}

server.registerTool(
  'list-available-nodes',
  {
    title: 'List Available Nodes',
    description:
      'Returns the currently registered workflow node plugins and their capabilities.',
  },
  (_extra: unknown) => {
    const nodes = getAvailableNodeSummaries();
    const textLines =
      nodes.length === 0
        ? ['No node plugins are currently registered.']
        : [
            'Currently available node plugins:',
            ...nodes.map((node, index) => {
              const header = `${index + 1}. ${node.nodeType}`;
              const summaryParts = [
                node.name ? `name: ${node.name}` : null,
                node.purpose ? `purpose: ${node.purpose}` : null,
                node.useCases.length > 0
                  ? `use cases: ${node.useCases.join(', ')}`
                  : null,
              ].filter(Boolean);
              return summaryParts.length > 0
                ? `${header} — ${summaryParts.join(' | ')}`
                : header;
            }),
          ];

    return {
      content: [
        {
          type: 'text' as const,
          text: textLines.join('\n'),
        },
      ],
      structuredContent: { nodes },
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function handleShutdown(signal: NodeJS.Signals) {
  void server
    .close()
    .catch((error) => {
      console.error(`Failed to close MCP server on ${signal}:`, error);
    })
    .finally(() => {
      process.exit(0);
    });
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
