#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ToolsAccountStack } from '../lib/tools-account-stack';
import { TargetAccountRolesStack } from '../lib/target-account-stack';

const app = new cdk.App();
new ToolsAccountStack(app, 'tools-account-roles', {
    env: {
        account: '<tools-account-id>',
        region: '<region>'
    },
    crossAccountRoleArn: [
        'arn:aws:iam::<target-account-id>:role/github-action-cross-account-role'
    ]
});

new TargetAccountRolesStack(app, 'dev-github-action-target-account-roles', {
    env: {
        account: '<target-account-id>',
        region: '<region>'
    },
    toolsAccountUserArn: 'arn:aws:iam::<tools-account-id>:user/github-action-deployment-user'
});