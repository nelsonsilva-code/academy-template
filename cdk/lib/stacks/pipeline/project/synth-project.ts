import { CfnProxy, CfnProxyCredentials } from '@vw-sre/vws-cdk';
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
  ProjectProps,
} from 'aws-cdk-lib/aws-codebuild';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";

interface SynthProjectProps {
  vpc: IVpc
  proxy: CfnProxy
  proxyCredentials: CfnProxyCredentials,
  gitTokenSecret: ISecret,
  noProxySuffixes?: string
}

export class SynthProject extends PipelineProject {
  constructor(scope: Construct, id: string, props: SynthProjectProps) {
    const projectProps: ProjectProps = {
      vpc: props.vpc,
      environmentVariables: {
        PROXY_USER: {
          value: `${props.proxyCredentials.secretsArn}:username`,
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
        PROXY_PASSWORD: {
          value: `${props.proxyCredentials.secretsArn}:password`,
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
        PROXY_URL: {
          value: props.proxy.dnsName,
        },
        NO_PROXY: {
          value: props.noProxySuffixes ? props.noProxySuffixes+',amazonaws.com,ecr.aws' : 'amazonaws.com,ecr.aws',
        },
        GITHUB_TOKEN: {
          value: `${props.gitTokenSecret.secretArn}:githubToken`,
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
      },
      environment: {
        privileged: true,
        buildImage: LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install: {
            commands: [
              // Set proxy
              'export HTTPS_PROXY=http://${PROXY_USER}:${PROXY_PASSWORD}@${PROXY_URL}:8080',
              'export HTTP_PROXY=${HTTPS_PROXY}',
              // Update npm
              'npm install -g npm@9.8.1',
              // Setup private registry
              'export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain vw-sre --domain-owner 565220512126 --query authorizationToken --output text)',
              'npm config set @vw-sre:registry https://vw-sre-565220512126.d.codeartifact.eu-west-1.amazonaws.com/npm/vw-sre/',
              'npm config set //vw-sre-565220512126.d.codeartifact.eu-west-1.amazonaws.com/npm/vw-sre/:_authToken ${CODEARTIFACT_AUTH_TOKEN}',
              'echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > cdk/.npmrc',
              'echo "@nelsonsilva-code:registry=https://npm.pkg.github.com/nelsonsilva-code" >> cdk/.npmrc',
              'echo "legacy-peer-deps=true" >> cdk/.npmrc',
              // Install cdk modules
              'cd cdk',
              'npm i',
            ],
          },
          build: {
            commands: [
              'npx cdk synth --no-notices',
            ],
          },
        },
        artifacts: {
          'base-directory': 'cdk/cdk.out',
          'files': [
            '**/*',
          ],
        },
      }),
    };
    super(scope, id, projectProps);

    this.allowCodebuild()


  }

  private allowCodebuild() {
    this.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['codebuild:*', 'kms:*', 'sts:*', 'secretsmanager:*', 'codeartifact:*','ec2:*'],
      resources: ['*'],
    }));
  }

}
