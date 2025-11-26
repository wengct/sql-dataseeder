/**
 * 產生選項
 */
export interface GenerationOptions {
  /** 要產生的筆數（預設 10） */
  readonly rowCount: number;
}

/**
 * 產生結果
 */
export interface GenerationResult {
  /** 是否成功 */
  readonly success: boolean;

  /** 產生的 Insert 語法（若成功） */
  readonly script: string | null;

  /** 實際產生的筆數 */
  readonly rowCount: number;

  /** 被跳過的欄位名稱（不支援的類型） */
  readonly skippedColumns: readonly string[];

  /** 錯誤訊息（若失敗） */
  readonly errorMessage: string | null;
}

/**
 * 建立成功的產生結果
 */
export function createSuccessResult(
  script: string,
  rowCount: number,
  skippedColumns: readonly string[]
): GenerationResult {
  return {
    success: true,
    script,
    rowCount,
    skippedColumns,
    errorMessage: null
  };
}

/**
 * 建立失敗的產生結果
 */
export function createErrorResult(errorMessage: string): GenerationResult {
  return {
    success: false,
    script: null,
    rowCount: 0,
    skippedColumns: [],
    errorMessage
  };
}

/**
 * 預設產生選項
 */
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  rowCount: 10
};
