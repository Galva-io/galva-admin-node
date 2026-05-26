import { PlaystoreCredentials } from '@/galvaWithCreds';
import { google } from 'googleapis';

const authentication = (payload: { email: string; key: string }) => {
  const jwtClient = new google.auth.JWT({
    email: payload.email,
    key: payload.key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  return google.androidpublisher({
    version: 'v3',
    auth: jwtClient,
  });
};

export class PlaystoreService {
  static async getSubscription(
    token: string,
    packageName: string,
    cred: PlaystoreCredentials,
  ): Promise<any> {
    const client = authentication({
      email: cred.email,
      key: cred.key,
    });

    const result = await client.purchases.subscriptionsv2.get({
      token,
      packageName,
    });

    return result;
  }
}
