import {
	Stack,
	StackProps,
	Duration,
	aws_lambda as lambda,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class StepFunctionsStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		//! Lambda関数の作成
		const taskFn = new lambda.Function(this, "TaskFn", {
			runtime: lambda.Runtime.NODEJS_12_X,
			code: lambda.Code.fromAsset("handlers"),
			handler: "task.handler",
		});

		//! StepFunctionsのタスク定義
		const firstState = new tasks.LambdaInvoke(this, "最初の処理", {
			lambdaFunction: taskFn,
			// Taskのoutputを指定、$.Payloadを指定することでLambdaの戻り値を次のTaskへ渡す
			outputPath: "$.Payload",
		});
		// 並列処理1
		const paralellState1 = new tasks.LambdaInvoke(this, "並列処理1", {
			lambdaFunction: taskFn,
		});
		// 並列処理2
		const paralellState2 = new tasks.LambdaInvoke(this, "並列処理2", {
			lambdaFunction: taskFn,
		});
		// 10秒待つstateを作成
		const wait10 = new sfn.Wait(this, "10秒待つ", {
			time: sfn.WaitTime.duration(Duration.seconds(10)),
		});
		const secondState = new tasks.LambdaInvoke(this, "次の処理", {
			// Taskのinputを指定、$とすることで、上のTaskのJSONがすべてInputに渡る
			inputPath: "$",
			lambdaFunction: taskFn,
		});

		//! 並列処理(Parallel)の実装
		// Parallelクラスのインスタンスを作成
		// const parallel = new sfn.Parallel(this, "Parallel");
		// ブランチ関数を使い並列処理stateを指定する
		// parallel.branch(paralellState1, paralellState2).next(wait10);

		//! 条件分岐(Choice)の実装
		// Choiceクラスのインスタンスを作成
		const choice = new sfn.Choice(this, "ChoiceState");
		//when()メソッドで条件分岐を定義
		choice.when(
			// 前のstateから渡されたoutputのmessageの値がHelloなら処理1に遷移
			sfn.Condition.stringEquals("$.message", "Hello"),
			new sfn.Pass(this, "処理1")
		);
		choice.when(
			sfn.Condition.stringEquals("$.message", "World"),
			new sfn.Pass(this, "処理2")
		);
		// whenが一致しなかった場合
		choice.otherwise(new sfn.Pass(this, "処理3"));

		//! 処理順番の定義
		// Taskを.next()でつなぐ、戻り値としてステートマシンの実態が返却
		const definition = firstState.next(choice);

		//! ステートマシンを作成するクラスの引数に渡す
		new sfn.StateMachine(this, "stateMachine", {
			definition,
		});
	}
}
