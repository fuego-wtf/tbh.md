export interface CliContext {
  json: boolean;
}

export interface CliSuccess<T = unknown> {
  ok: true;
  code: 0;
  message: string;
  data?: T;
}

export interface CliFailure<T = unknown> {
  ok: false;
  code: 1 | 2;
  message: string;
  data?: T;
}

export type CliResult<T = unknown> = CliSuccess<T> | CliFailure<T>;

export function printResult<T>(ctx: CliContext, result: CliResult<T>): void {
  if (ctx.json) {
    const payload = {
      ok: result.ok,
      code: result.code,
      message: result.message,
      data: result.data,
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (result.ok) {
    console.log(result.message);
  } else {
    console.error(result.message);
  }

  if (result.data && !ctx.json) {
    console.log(JSON.stringify(result.data, null, 2));
  }
}
