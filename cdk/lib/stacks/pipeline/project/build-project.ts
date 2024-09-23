import {Environment} from 'aws-cdk-lib';
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
  ProjectProps,
} from 'aws-cdk-lib/aws-codebuild';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {IVpc} from 'aws-cdk-lib/aws-ec2';
import { CfnProxy, CfnProxyCredentials } from '@vw-sre/vws-cdk';
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {Microservice} from "@nelsonsilva-code/cdk-commons";

interface BuildProjectProps {
  vpc: IVpc
  env?: Environment,
  proxy:CfnProxy,
  proxyCredentials: CfnProxyCredentials,
  gitTokenSecret: ISecret,
  noProxySuffixes?: string,
}

export class BuildProject extends PipelineProject {
  constructor(scope: Construct, microservice: Microservice, ecrRepo: IRepository, props: BuildProjectProps) {

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
        PROXY_PORT: {
          value: '8080'
        },
        GITHUB_USER: {
          value: `${props.gitTokenSecret.secretName}:githubUser`,
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
        GITHUB_TOKEN: {
          value: `${props.gitTokenSecret.secretName}:githubToken`,
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
      },
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        privileged: true
      },
      buildSpec: BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install:{
            commands: [
              "export HTTPS_PROXY=http://${PROXY_USER}:${PROXY_PASSWORD}@${PROXY_URL}:${PROXY_PORT}",
              "export https_proxy=${HTTPS_PROXY}",
              "export HTTP_PROXY=${HTTPS_PROXY}",
              "export http_proxy=${HTTPS_PROXY}",
              'export PROXY_URL=${PROXY_URL}',
              'export PROXY_PORT=${PROXY_PORT}',
              'export PROXY_USER=${PROXY_USER}',
              'export PROXY_PASSWORD=${PROXY_PASSWORD}',
              'export NO_PROXY=${NO_PROXY}',
              'npm install -g npm@9.8.1'
            ],
            "runtime-versions": {
              java: "corretto17"
            }
          },
          "pre_build": {
            commands: [
              `aws ecr get-login-password --region ${props?.env?.region} | docker login --username AWS --password-stdin  ${props?.env?.account}.dkr.ecr.${props?.env?.region}.amazonaws.com`,
              'export TAG="$(date +%s)"',
            ],
          },
          build: {
            commands: [
              //'./gradlew test',
              `docker build -t ${microservice.name.toLowerCase()}:$TAG . `,
              `docker tag ${microservice.name.toLowerCase()}:$TAG ${ecrRepo.repositoryUri}:$TAG`,
              `docker tag ${microservice.name.toLowerCase()}:$TAG ${ecrRepo.repositoryUri}`,
              `docker push ${ecrRepo.repositoryUri}:$TAG`,
              `docker push ${ecrRepo.repositoryUri}`,
              `printf "[{\\"name\\": \\"${ecrRepo.repositoryName}\\", \\"imageUri\\": \\"${ecrRepo.repositoryUri}:latest\\"}]" > imagedefinitions.json`,
            ],
          },
          "post_build": {
            commands: [],
          }
        },
        artifacts: {
          files: ['imagedefinitions.json']
        },
      }),
    };
    super(scope, microservice.name+'BuildProject', projectProps);

    this.allowCodebuild()


  }

  private allowCodebuild() {
    this.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['codebuild:*', 'kms:*', 'sts:*', 'secretsmanager:*', 'codeartifact:*', 'ecr:*','ec2:*'],
      resources: ['*'],
    }));
  }

}
