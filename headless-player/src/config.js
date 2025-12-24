class Config {
  constructor() {
    this.environment = process.env.ENVIRONMENT || 'dev';
    this.cloudEnv = process.env.CLOUD_ENV || 'cloudtest1';
    this.version = process.env.VERSION || '2.0.0';
    this.buildNumber = process.env.BUILD_NUMBER || 'dev';
  }

  getEnvironmentConfig() {
    return {
      environment: this.environment,
      cloudEnv: this.cloudEnv,
      version: this.version,
      buildNumber: this.buildNumber,
      apiBase: this.getApiBase(),
      awsSettingsUrl: this.getAWSSettingsUrl()
    };
  }

  getApiBase() {
    const endpoints = {
      'dev': `https://api-${this.cloudEnv}.fwi-dev.com`,
      'staging': 'https://api-staging.fwi-dev.com',
      'prod': 'https://api.fwicloud.com',
      'prod-eu': 'https://api.eu1.fwicloud.com',
      'prod-ap': 'https://api.ap1.fwicloud.com'
    };
    return endpoints[this.environment] || endpoints['dev'];
  }

  getAWSSettingsUrl() {
    const envKey = this.environment === 'dev' ? this.cloudEnv : this.environment;
    return `https://api-${envKey}.fwi-dev.com/aws-settings`;
  }

  validateEnvironment() {
    const validEnvironments = ['dev', 'staging', 'prod', 'prod-eu', 'prod-ap'];
    const validCloudEnvs = ['cloudtest1', 'cloudtest2', 'contributor', 'admin', 'network'];

    if (!validEnvironments.includes(this.environment)) {
      throw new Error(`Invalid ENVIRONMENT: ${this.environment}. Must be one of: ${validEnvironments.join(', ')}`);
    }

    if (this.environment === 'dev' && !validCloudEnvs.includes(this.cloudEnv)) {
      throw new Error(`Invalid CLOUD_ENV: ${this.cloudEnv}. Must be one of: ${validCloudEnvs.join(', ')}`);
    }

    console.log(`Environment: ${this.environment}${this.environment === 'dev' ? ` (${this.cloudEnv})` : ''}`);
    console.log(`Version: ${this.version}.${this.buildNumber}`);
    console.log(`API Base: ${this.getApiBase()}`);
  }
}

module.exports = Config;