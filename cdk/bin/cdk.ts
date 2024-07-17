#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {Microservice} from "../lib/interfaces/microservice-interface";
import {DevelopmentResources} from "../lib/stacks/environments/microservice-development-stack";
import {AuroraMysqlEngineVersion, DatabaseClusterEngine} from "aws-cdk-lib/aws-rds";
import {InstanceClass, InstanceSize} from "aws-cdk-lib/aws-ec2";
import {ProductionResources} from "../lib/stacks/environments/microservice-prod-stack";
import {IntegrationResources} from "../lib/stacks/environments/microservice-integration-stack";
import {Duration} from "aws-cdk-lib";


const app = new cdk.App();

const integrationEnv = {
    account: '462707719390',
    region: 'eu-west-1',
};

const devEnv = {
    account: '823810905047',
    region: 'eu-west-1',
};
const prodEnv = {
    account: '060139155903',
    region: 'eu-west-1',
}

const currentEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT!.toString(),
    region: process.env.CDK_DEFAULT_REGION!.toString(),
}

const microservice = {
    name: "PdeTemplate", //TODO: Change me
    gitRepo: 'microservice-template', //TODO: Change me
    gitOwner: 'pre-delivery-enrolment'
} as Microservice

const fargateHcPort = 9999 //TODO: Change me
const fargatePortMappings = [9999, 5005] //TODO: Change me
if (currentEnv.account == integrationEnv.account) {
    const stage = 'Integration'
    new IntegrationResources({
        app: app,
        env: currentEnv,
        microservice,
        stage: stage,
        allowedProxyPorts: [443, 80],
        allowedProxySuffixes: ['amazonaws.com', 'vwgroup.io', 'cariad.digital', 'vwapps.run', 'amazonaws.com', 'log-api.eu.newrelic.com', 'gradle.org', 'nr-data.net', 'nr-assets.net', 'servicebus.windows.net'],
        noProxySuffixes: 'amazonaws.com,vwapps.run,vwapps.io,vwgroup.io,vwgroup.com,vwg-connect.com,volkswagenag.com,cariad.cloud,cariad.digital',
        ecrSuffix: '_snapshot',
        githubSecretName: 'microservices/github/secret',
        codestarProps: {
            owner: microservice.gitOwner,
            repo: microservice.gitRepo,
            connectionArn: 'arn:aws:codestar-connections:eu-west-1:462707719390:connection/6abfbf1a-7840-40f4-9a4e-a499f8c4e71b',
            branch: 'development',
            triggerOnPush: true,
        },
        fargate: {
            fargateServiceName: `${microservice.name}-${stage.toLowerCase()}-fargate-service`,
            fargateClusterName: `${microservice.name}-${stage.toLowerCase()}-cluster`,
            fargateHcPort,
            fargatePortMappings,
            fargateTaskDefinition: {
                cpu: 256,
                memoryLimitMiB: 512,
            },
            appProfile: 'integration',
            taskDesiredCount: 1,
            addFargateMonitoring: {
                cpu: {addMonitor: true},
                memory: {addMonitor: true},
                runningTasks: {addMonitor: true}
            },
        },
        alarmTopicArn: `arn:aws:sns:${currentEnv.region}:${currentEnv.account}:${stage}-microservices-alarms`
    });

} else if (currentEnv.account == devEnv.account){
    const stage = 'Develop'
    new DevelopmentResources({
        app: app,
        env: currentEnv,
        microservice,
        stage: stage,
        allowedProxyPorts: [443, 80],
        allowedProxySuffixes: ['amazonaws.com','vwgroup.io','cariad.digital', 'vwapps.run', 'amazonaws.com', 'log-api.eu.newrelic.com','gradle.org','nr-data.net','nr-assets.net','servicebus.windows.net'],
        noProxySuffixes: 'amazonaws.com,vwapps.run,vwapps.io,vwgroup.io,vwgroup.com,vwg-connect.com,volkswagenag.com,cariad.cloud,cariad.digital',
        ecrSuffix: '_snapshot',
        githubSecretName: 'microservices/github/secret',
        codestarProps: {
            owner: microservice.gitOwner,
            repo: microservice.gitRepo,
            connectionArn: 'arn:aws:codestar-connections:eu-west-1:823810905047:connection/d7b36f42-f284-44cc-ad1f-8355139714e5',
            branch: 'development',
            triggerOnPush: true,
        },
        fargate: {
            fargateServiceName: `${microservice.name}-${stage.toLowerCase()}-fargate-service`,
            fargateClusterName: `${microservice.name}-${stage.toLowerCase()}-cluster`,
            fargateTaskDefinition: {
                cpu: 256,
                memoryLimitMiB: 512,
            },
            fargateHcPort,
            fargatePortMappings,
            taskDesiredCount: 1,
            appProfile: 'development',
        },
        alarmTopicArn: `arn:aws:sns:${currentEnv.region}:${currentEnv.account}:${stage}-microservices-alarms`
    });

}
else if (currentEnv.account == prodEnv.account){
    const prodStage = 'Production'
    const preliveStage = 'Prelive'

    new ProductionResources({
        app: app,
        env: currentEnv,
        microservice,
        ecrSuffix: '_release',
        githubSecretName: 'microservices/github/secret',
        codestarProps: {
            owner: microservice.gitOwner,
            repo: microservice.gitRepo,
            connectionArn: 'arn:aws:codestar-connections:eu-west-1:060139155903:connection/e04c6027-af51-47c0-b2c2-454489dc0e39',
            branch: 'main',
            triggerOnPush: true,
        },
        allowedProxyPorts: [443, 80],
        allowedProxySuffixes: ['amazonaws.com','vwgroup.io','cariad.digital', 'vwapps.run', 'amazonaws.com', 'log-api.eu.newrelic.com','gradle.org','nr-data.net','nr-assets.net','servicebus.windows.net'],
        noProxySuffixes: 'amazonaws.com,vwapps.run,vwapps.io,vwgroup.io,vwgroup.com,vwg-connect.com,volkswagenag.com,cariad.cloud,cariad.digital',
        production: {
            stage: prodStage,
            fargate: {
                fargateClusterName: `${microservice.name}-${prodStage.toLowerCase()}-cluster`,
                fargateServiceName: `${microservice.name}-${prodStage.toLowerCase()}-fargate-service`,
                fargateTaskDefinition: {
                    cpu: 256,
                    memoryLimitMiB: 512,
                },
                fargateHcPort,
                fargatePortMappings,
                taskDesiredCount: 1,
                appProfile: 'prod',
            },
            alarmTopicArn: `arn:aws:sns:${currentEnv.region}:${currentEnv.account}:${prodStage}-microservices-alarms`
        },
        prelive: {
            stage: 'Prelive',
            fargate: {
                fargateClusterName: `${microservice.name}-${preliveStage.toLowerCase()}-cluster`,
                fargateServiceName: `${microservice.name}-${preliveStage.toLowerCase()}-fargate-service`,
                fargateTaskDefinition: {
                    cpu: 256,
                    memoryLimitMiB: 512,
                },
                fargateHcPort,
                fargatePortMappings,
                taskDesiredCount: 1,
                appProfile: 'prelive',
            },
            alarmTopicArn: `arn:aws:sns:${currentEnv.region}:${currentEnv.account}:${preliveStage}-microservices-alarms`
        },
    })

}
