#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {InstanceClass, InstanceSize} from "aws-cdk-lib/aws-ec2";
import {AcademyResources} from "../lib/stacks/environments/academy-resources";
import {Microservice} from "@nelsonsilva-code/cdk-commons";


const app = new cdk.App();

const academyEnv = {
    account: '987866352473',
    region: 'eu-west-1',
};

const currentEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT!.toString(),
    region: process.env.CDK_DEFAULT_REGION!.toString(),
}

const microservice = {
    name: "JosePinhal", //TODO: Change me
    gitRepo: 'academy-template',
    gitOwner: 'nelsonsilva-code', //TODO: Change me
} as Microservice
const fargateHcPort = 9999
const fargatePortMappings = [9999, 5005]

if (currentEnv.account == academyEnv.account) {
    new AcademyResources({
        app: app,
        env: currentEnv,
        microservice,
        stage: 'Academy',
        ecrSuffix: '_snapshot',
        githubSecretName: `${microservice.name.toLowerCase()}/github/secret`,
        codestarProps: {
            owner: microservice.gitOwner,
            repo: microservice.gitRepo,
            connectionArn: 'arn:aws:codeconnections:eu-west-1:987866352473:connection/8eba362e-edd4-4448-9178-52ebc0514f71', //TODO: Change me
            branch: 'main',
            triggerOnPush: true,
        },
        fargate: {
            fargateServiceName: `${microservice.name}-academy-fargate-service`,
            fargateClusterName: `${microservice.name}-academy-cluster`,
            fargateHcPort,
            fargatePortMappings,
            fargateTaskDefinition: {
                cpu: 1024,
                memoryLimitMiB: 2048,
            },
            appProfile: 'academy',
            taskDesiredCount: 1,
        },
    });
} else {
    throw new Error(`Unrecognized account. Supported account is ${academyEnv.account}. Current account is ${currentEnv.account}`);
}