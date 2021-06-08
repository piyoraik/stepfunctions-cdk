import * as cdk from 'aws-cdk-lib';
import * as StepFunctions from '../lib/step-functions-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new StepFunctions.StepFunctionsStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
