import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SolrApi implements ICredentialType {
  name = 'solrApi';
  displayName = 'Solr API';
  documentationUrl = 'https://solr.apache.org/';
  properties: INodeProperties[] = [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: '127.0.0.1',
      required: true,
    },
    {
      displayName: 'Port',
      name: 'port',
      type: 'string',
      default: '8983',
    },
    {
      displayName: 'Core',
      name: 'core',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Path',
      name: 'path',
      type: 'string',
      default: '/solr',
      required: true,
    },
    {
      displayName: 'Secure (HTTPS)',
      name: 'secure',
      type: 'boolean',
      default: false,
      required: true,
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
  ];
}
