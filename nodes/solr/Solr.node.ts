import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
const { createClient } = require('@magierin-schnee/solr-client');

export class Solr implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Solr',
    name: 'solr',
    icon: 'file:solr.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{ $parameter["operation"] }}',
    description: 'Interact with Apache Solr',
    defaults: {
      name: 'Solr',
    },
    inputs: ['main' as NodeConnectionType],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      {
        name: 'solrApi',
        required: true,
      },
    ],
    /**
     * In n8n, the properties of a node are defined in its corresponding
     * .node.json file. This file is the single source of truth for the node's
     * properties. The properties below are for reference and should be kept
     * in sync with the .node.json file.
     */
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
								noDataExpression: true,
        options: [
          { name: 'Add or Update Document', value: 'addOrUpdateDocument' },
          { name: 'Delete All Documents', value: 'deleteAllDocuments' },
          { name: 'Delete by Field', value: 'deleteByField' },
          { name: 'Delete by ID', value: 'deleteById' },
          { name: 'Delete by Query', value: 'deleteByQuery' },
          { name: 'Search By Query', value: 'searchByQuery' },
        ],
        default: 'searchByQuery',
      },
      {
        displayName: 'Commit',
        name: 'commit',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            operation: [
              'addOrUpdateDocument',
              'deleteAllDocuments',
              'deleteById',
              'deleteByField',
              'deleteByQuery',
            ],
          },
        },
        description: 'Whether to make the changes immediately visible',
      },
      {
        displayName: 'Document',
        name: 'document',
        type: 'json',
        required: true,
        default: '{}',
        displayOptions: {
          show: {
            operation: ['addOrUpdateDocument'],
          },
        },
        description: 'The document to add or update, in JSON format',
      },
      {
        displayName: 'Ignore Version Conflict (Overwrite)',
        name: 'ignoreVersionConflict',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            operation: ['addOrUpdateDocument'],
          },
        },
        description:
          'If enabled, it will overwrite the document in Solr, ignoring any version conflicts. This may overwrite changes made by other processes.',
      },
      {
        displayName: 'Document ID',
        name: 'documentId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            operation: ['deleteById'],
          },
        },
        description: 'The ID of the document to delete',
      },
      {
        displayName: 'Field Name',
        name: 'fieldName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            operation: ['deleteByField'],
          },
        },
        description: 'The name of the field to delete by',
      },
      {
        displayName: 'Field Value',
        name: 'fieldValue',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            operation: ['deleteByField'],
          },
        },
        description: 'The value of the field to delete by',
      },
      {
        displayName: 'Delete Query',
        name: 'deleteQuery',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            operation: ['deleteByQuery'],
          },
        },
        description: 'The query to delete documents by',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        required: true,
        default: '*:*',
        displayOptions: {
          show: {
            operation: ['searchByQuery'],
          },
        },
        description: "The search query (e.g., 'title:solr' or '*:*' for all documents)",
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: {
            operation: ['searchByQuery'],
          },
        },
        options: [
          {
            displayName: 'Default Field (Df)',
            name: 'df',
            type: 'string',
            default: '',
            description: 'The default field to search in',
          },
          {
            displayName: 'Field List (Fl)',
            name: 'fl',
            type: 'string',
            default: '',
            description: 'A comma-separated list of fields to return',
          },
          {
            displayName: 'Query Operator (q.op)',
            name: 'qOp',
            type: 'options',
            options: [
              {
                name: 'AND',
                value: 'AND',
              },
              {
                name: 'OR',
                value: 'OR',
              },
            ],
            default: 'OR',
            description: 'The default operator for query expressions',
          },
          {
            displayName: 'Response Writer (Wt)',
            name: 'wt',
            type: 'string',
            default: '',
            placeholder: 'json',
            description: 'The response writer to use',
          },
          {
            displayName: 'Rows',
            name: 'rows',
            type: 'number',
            typeOptions: {
              minValue: 1,
            },
            default: 10,
            description: 'The number of rows to return',
          },
          {
            displayName: 'Sort',
            name: 'sort',
            type: 'string',
            default: '',
            description: "Sort order, e.g., 'price asc' or 'score desc'",
          },
          {
            displayName: 'Start',
            name: 'start',
            type: 'number',
            typeOptions: {
              minValue: 0,
            },
            default: 0,
            description: 'The offset to start from',
          },
        ],
      },
      {
        displayName: 'Filter Queries (Fq)',
        name: 'filterQueries',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            operation: ['searchByQuery'],
          },
        },
        default: {},
        placeholder: 'Add Filter Query',
        options: [
          {
            name: 'filters',
            displayName: 'Filters',
            values: [
              {
                displayName: 'Filter Query',
                name: 'fq',
                type: 'string',
                default: '',
                description: 'E.g. category:electronics or price:[* TO 100].',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('solrApi');
    const client = createClient({
      host: credentials.host,
      port: credentials.port,
      core: credentials.core,
      path: credentials.path,
      secure: credentials.secure,
    });
    if (credentials.username && credentials.password) {
      client.setBasicAuth(credentials.username, credentials.password);
    }
    const operation = this.getNodeParameter('operation', 0) as string;
    // Operation handling skeleton
    for (let i = 0; i < items.length; i++) {
      try {
        let result;
        if (operation === 'searchByQuery') {
          const queryString = this.getNodeParameter('query', i, '*:*') as string;
          const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
            qOp?: string;
            sort?: string;
            rows?: number;
            start?: number;
            fl?: string;
            df?: string;
            wt?: string;
          };
          const filterQueries = this.getNodeParameter('filterQueries', i, {}) as {
            filters?: Array<{ fq?: string }>;
          };

          const query = client.createQuery().setQuery(queryString);

          if (additionalFields.qOp) {
            query.params = query.params || [];
            query.params.push(`q.op=${additionalFields.qOp}`);
          }

          if (filterQueries.filters && filterQueries.filters.length > 0) {
            for (const filter of filterQueries.filters) {
              if (filter.fq) {
                const separatorIndex = filter.fq.indexOf(':');
                if (separatorIndex > 0) {
                  const field = filter.fq.substring(0, separatorIndex);
                  const value = filter.fq.substring(separatorIndex + 1);
                  query.addFilters({ field, value });
                }
              }
            }
          }

          if (additionalFields.sort) {
            const [field, order] = additionalFields.sort.split(' ');
            if (field && order) {
              query.setSort({ [field]: order });
            }
          }
          if (additionalFields.rows) {
            query.setLimit(additionalFields.rows);
          }
          if (additionalFields.start) {
            query.setOffset(additionalFields.start);
          }
          if (additionalFields.fl) {
            query.setResponseFields(additionalFields.fl.split(','));
          }

          // The client does not directly support df and wt, these would
          // typically be handled by appending to the request URL, which
          // may require modifying the client or using a different one.
          // For now, they are parsed but not used.

          const response = await client.searchDocuments(query);
          result = response.response.docs;
        } else if (operation === 'addOrUpdateDocument') {
          const commit = this.getNodeParameter('commit', i, true) as boolean;
          const ignoreVersionConflict = this.getNodeParameter('ignoreVersionConflict', i, false) as boolean;
          let docOrDocs = this.getNodeParameter('document', i);

          if (typeof docOrDocs === 'string') {
            docOrDocs = JSON.parse(docOrDocs);
          }

          if (ignoreVersionConflict) {
            if (Array.isArray(docOrDocs)) {
              docOrDocs.forEach((doc) => {
                if (doc && typeof doc === 'object' && (doc as any)['_version_']) {
                  delete (doc as any)['_version_'];
                }
              });
            } else if (docOrDocs && typeof docOrDocs === 'object') {
              delete (docOrDocs as any)['_version_'];
            }
          }

          result = await client.addDocuments(docOrDocs as object, { commit });
        } else if (operation === 'deleteById') {
          const commit = this.getNodeParameter('commit', i, true) as boolean;
          const docId = this.getNodeParameter('documentId', i) as string;
          result = await client.deleteById(docId, { commit });
        } else if (operation === 'deleteByField') {
          const commit = this.getNodeParameter('commit', i, true) as boolean;
          const fieldName = this.getNodeParameter('fieldName', i) as string;
          const fieldValue = this.getNodeParameter('fieldValue', i) as string;
          result = await client.deleteByField(fieldName, fieldValue, { commit });
        } else if (operation === 'deleteByQuery') {
          const commit = this.getNodeParameter('commit', i, true) as boolean;
          const deleteQuery = this.getNodeParameter('deleteQuery', i) as string;
          result = await client.deleteByQuery(deleteQuery, { commit });
        } else if (operation === 'deleteAllDocuments') {
          const commit = this.getNodeParameter('commit', i, true) as boolean;
          result = await client.deleteAllDocuments({ commit });
        }

        if (result) {
          returnData.push({ json: result, pairedItem: { item: i } });
        } else {
          returnData.push({ json: { success: true }, pairedItem: { item: i } });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }
    return [returnData];
  }
}
