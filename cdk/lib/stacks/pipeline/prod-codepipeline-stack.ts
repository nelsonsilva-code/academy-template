import { Construct } from 'constructs';
import { StackProps, Stack} from "aws-cdk-lib";
import {AccountPrincipal } from "aws-cdk-lib/aws-iam";
import {Artifact, StagePlacement} from "aws-cdk-lib/aws-codepipeline";
import {CodeStarConnectionsSourceAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {CfnProxy, CfnProxyCredentials, SharedVpc} from "@vw-sre/vws-cdk";
import {SynthProject} from "./project/synth-project";
import {Microservice} from "../../interfaces/microservice-interface";
import {BuildProject} from "./project/build-project";
import {BaseService} from "aws-cdk-lib/aws-ecs";
import {ApplicationProfile, CustomCodepipeline, EnvironmentStage} from "@pre-delivery-enrolment/cdk-commons";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {ProductionInterface} from "../../interfaces/environment-interfaces";

interface ProductionCodepipelineProps extends ProductionInterface {
  stackProps: StackProps,
  stage: EnvironmentStage['stage'],
  stackName: string,
  ecrRepo: IRepository,
}

export class ProductionCodepipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: ProductionCodepipelineProps) {
    super(scope, id, props);

    const sourceArtifact = new Artifact('source');

    const sourceAction = new CodeStarConnectionsSourceAction({
      ...props.codestarProps,
      actionName: 'GitHubSource',
      output: sourceArtifact,
    });

    const vpc = new SharedVpc(this, 'SharedVpc', {
      account: this.account,
      region: this.region,
      availabilityZones: this.availabilityZones,
    }).vpc

    const proxy = new CfnProxy(this, 'Proxy', {
      allowedCidrs: [],
      allowedPorts: [443],
      allowedSuffixes: [
        // Infrastructure
        'amazonaws.com', // To setup registry for vw-sre
        'github.com',
        'githubusercontent.com', //OneHub and D6
        'bintray.com',
        'gradle-dn.com',
        'maven.org',
        'maven.apache.org',
        'yum.corretto.aws',
        'cdn.amazonlinux.com',
        'amazonlinux.default.amazonaws.com',
        'dl.google.com',
        // Frontend
        'registry.npmjs.org',
        'gradle.org',
        'd2glxqk2uabbnd.cloudfront.net',
        'dl-cdn.alpinelinux.org', // To download curl inside the frontend Dockerfile
      ],
    });


    const proxyCredentials = new CfnProxyCredentials(this, 'ProxyCredentials', {
      instance: proxy,
      principals: [new AccountPrincipal(this.account).arn],
    });

    const gitTokenSecret = Secret.fromSecretNameV2(this, 'GithubSecret', 'microservices/github/secret')

    const synthProject = new SynthProject(this, 'SynthProject', {
      vpc,
      proxy: proxy,
      proxyCredentials: proxyCredentials,
      gitTokenSecret
    });

    const buildProject = new BuildProject(this, props.microservice, props.ecrRepo, {
      vpc,
      env: props.env,
      proxy,
      proxyCredentials,
      gitTokenSecret
    });

    const pipeline = new CustomCodepipeline(this, 'Pipeline', {
      stackProps: props.stackProps,
      stage: props.stage,
      microservice: props.microservice,
      env: props.env,
      sourceAction,
      vpc,
      proxy,
      sourceArtifact,
      synthProject,
      buildProject,
    });

    const servicePrelive = BaseService.fromServiceArnWithCluster(
        this,
        "ServicePrelive",
        `arn:aws:ecs:${this.region}:${this.account}:service/${props.prelive.fargate.fargateClusterName}/${props.prelive.fargate.fargateServiceName}`,
    );

    const deployToPrelive = pipeline.addEcsDeployment(
        'DeployToPrelive',
        'DeployECS',
        servicePrelive
    )

    const manualPlacement: StagePlacement = {
      justAfter: deployToPrelive
    };

    const manualApproval = pipeline.addManualApproval(
        'MoveToProduction',
        manualPlacement,
    );

    const productionPlacement: StagePlacement = {
      justAfter: manualApproval
    };

    const serviceProd = BaseService.fromServiceArnWithCluster(
        this,
        "ServiceProduction",
        `arn:aws:ecs:${this.region}:${this.account}:service/${props.production.fargate.fargateClusterName}/${props.production.fargate.fargateServiceName}`,
    );

    pipeline.addEcsDeployment(
        'DeployToProduction',
        'DeployECS',
        serviceProd,
        productionPlacement
    )
  }
}



