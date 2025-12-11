import { DefaultAzureCredential } from '@azure/identity';
import { ContainerAppsAPIClient } from '@azure/arm-appcontainers';

const credential = new DefaultAzureCredential();
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || '';
const resourceGroup = process.env.AZURE_RESOURCE_GROUP || 'magnus-rg';

export async function getContainerAppLogs(
  appName: string,
  revisionName?: string,
  limit: number = 1000
): Promise<any[]> {
  try {
    const client = new ContainerAppsAPIClient(credential, subscriptionId);
    
    // Fetch logs using Azure Container Apps API
    const logs = await client.containerAppsRevisionReplicas.listReplicas(
      resourceGroup,
      appName,
      revisionName || 'latest'
    );

    // Transform to our format
    return logs.value?.map((replica) => ({
      timestamp: replica.createdTime,
      level: 'INFO',
      message: JSON.stringify(replica),
    })) || [];
  } catch (error) {
    console.error('Error fetching Azure logs:', error);
    return [];
  }
}

export async function getContainerAppRevisions(appName: string) {
  try {
    const client = new ContainerAppsAPIClient(credential, subscriptionId);
    
    const revisions = await client.containerAppsRevisions.listRevisions(
      resourceGroup,
      appName
    );

    return revisions.value || [];
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return [];
  }
}

export async function getContainerAppTraffic(appName: string) {
  try {
    const client = new ContainerAppsAPIClient(credential, subscriptionId);
    
    const app = await client.containerApps.get(resourceGroup, appName);
    
    return app.properties.configuration?.ingress?.traffic || [];
  } catch (error) {
    console.error('Error fetching traffic:', error);
    return [];
  }
}
