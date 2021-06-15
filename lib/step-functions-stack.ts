import {
	Stack,
	StackProps,
	aws_lambda as lambda,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class StepFunctionsStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// Lambda関数の作成
		const taskFn = new lambda.Function(this, "TaskFn", {
			runtime: lambda.Runtime.NODEJS_12_X,
			code: lambda.Code.fromAsset("handlers"),
			handler: "task.handler",
		});

		// StepFunctionsのタスク定義
		const firstState = new tasks.LambdaInvoke(this, "最初の処理", {
			lambdaFunction: taskFn,
			// Taskのoutputを指定、$.Payloadを指定することでLambdaの戻り値を次のTaskへ渡す
			outputPath: "$.Payload",
		});
		const secondState = new tasks.LambdaInvoke(this, "次の処理", {
			// Taskのinputを指定、$とすることで、上のTaskのJSONがすべてInputに渡る
			inputPath: "$",
			lambdaFunction: taskFn,
		});

		// Taskを.next()でつなぐ、戻り値としてステートマシンの実態が返却
		const definition = firstState.next(secondState);

		// ステートマシンを作成するクラスの引数に渡す
		new sfn.StateMachine(this, "stateMachine", {
			definition: definition,
		});
	}
}
