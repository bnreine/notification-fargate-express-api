const { Stage } = require('aws-cdk-lib');
const {
  NotificationFargateExpressApiStack,
} = require('./notification-fargate-express-api-stack');

class ProductionStage extends Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    new NotificationFargateExpressApiStack(
      this,
      'NotificationFargateExpressApiStack',
      props
    );
  }
}

module.exports = { ProductionStage };
