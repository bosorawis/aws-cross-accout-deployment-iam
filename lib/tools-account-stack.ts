import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';


interface EnvProps extends cdk.StackProps {
  crossAccountRoleArn: string[];
}

export class ToolsAccountStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: EnvProps) {
    super(scope, id, props);

    const deploymentUser = new iam.User(this, 'GitActionDeploymentUser', {
      userName: 'github-action-deployment-user'
    });

    deploymentUser.attachInlinePolicy(
      new iam.Policy(this, 'GitActionDeploymentUserPolicy', {
        statements: [
          new iam.PolicyStatement({
            sid: 'CrossAccountAssumeRole',
            actions: [
              'sts:AssumeRole'
            ],
            effect: iam.Effect.ALLOW,
            resources: props?.crossAccountRoleArn
          }),
          new iam.PolicyStatement({
            sid: 'STSSessionTagging',
            actions: [
              'sts:TagSession'
            ],
            effect: iam.Effect.ALLOW,
            resources: [
              '*'
            ]
          })
        ]
      }
      )
    )

    const accessKey = new iam.CfnAccessKey(this, 'GitActionDeploymentUserAccessKey', {
      userName: deploymentUser.userName
    });

    new ssm.StringParameter(this, 'GithubActionDeploymentUserAccessKeyParameter', {
      type: ssm.ParameterType.STRING,
      stringValue: accessKey.ref
    });

    new ssm.StringParameter(this, 'GithubActionDeploymentUserAccessKeySecretParameter', {
      type: ssm.ParameterType.STRING,
      stringValue: accessKey.attrSecretAccessKey
    });

  }
}
