import { Duration, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import {EnvironmentStage, Microservice} from "@nelsonsilva-code/cdk-commons";

interface SecretStackProps extends StackProps {
  githubSecretName: string;
  microservice: Microservice
}

export class SecretStack extends Stack {
  constructor(scope: Construct, id: string, props: SecretStackProps) {
    super(scope, id, props);

    const encryptionKey = new Key(this, 'KmsKey', {
      description: 'Kms key for academy secrets',
      alias: `${props.microservice.name}SecretsEncryptionKey`,
      enableKeyRotation: true,
      pendingWindow: Duration.days(7),
    });

    new Secret(this, 'GithubSecret', {
      secretName: props.githubSecretName,
      description: `Github token secret for pipelines`,
      encryptionKey,
      secretObjectValue: {
        githubToken: SecretValue.unsafePlainText('placeholder'),
        githubUser: SecretValue.unsafePlainText('placeholder'),
      }
    })
  }
}
