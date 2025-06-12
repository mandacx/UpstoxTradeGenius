import { storage } from "./storage";
import { upstoxService } from "./upstox";

export class ConfigService {
  private static instance: ConfigService;
  private initialized = false;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load Upstox configuration from database
      const clientIdConfig = await storage.getConfiguration("upstox_client_id");
      const clientSecretConfig = await storage.getConfiguration("upstox_client_secret");
      const redirectUriConfig = await storage.getConfiguration("upstox_redirect_uri");

      if (clientIdConfig && clientSecretConfig && redirectUriConfig) {
        // Update Upstox service with saved configuration
        upstoxService.updateConfig({
          clientId: clientIdConfig.value,
          clientSecret: clientSecretConfig.value,
          redirectUri: redirectUriConfig.value
        });

        console.log("Loaded Upstox configuration from database");
      } else {
        console.log("No saved Upstox configuration found, using environment defaults");
      }

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing configuration service:", error);
    }
  }

  async getUpstoxConfig(): Promise<{
    clientId?: string;
    redirectUri?: string;
    hasClientSecret: boolean;
  }> {
    const clientIdConfig = await storage.getConfiguration("upstox_client_id");
    const clientSecretConfig = await storage.getConfiguration("upstox_client_secret");
    const redirectUriConfig = await storage.getConfiguration("upstox_redirect_uri");

    return {
      clientId: clientIdConfig?.value,
      redirectUri: redirectUriConfig?.value,
      hasClientSecret: !!clientSecretConfig?.value
    };
  }
}

export const configService = ConfigService.getInstance();