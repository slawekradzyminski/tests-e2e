
export interface TrafficInfoDto {
  webSocketEndpoint: string;
  topic: string;
  description: string;
}

export interface TrafficLogEntryDto {
  correlationId: string;
  timestamp: string;
  clientSessionId: string | null;
  method: string;
  path: string;
  queryString: string | null;
  status: number;
  durationMs: number;
  requestHeaders: unknown;
  requestContentType: string | null;
  requestBody: unknown;
  requestBodyTruncated: boolean;
  requestBodyOriginalLength: number;
  requestBodyStoredLength: number;
  responseHeaders: unknown;
  responseContentType: string | null;
  responseBody: unknown;
  responseBodyTruncated: boolean;
  responseBodyOriginalLength: number;
  responseBodyStoredLength: number;
}

export interface TrafficPageDto {
  content: TrafficLogEntryDto[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface TrafficLogsQuery {
  page?: number;
  size?: number;
  method?: string;
  status?: number;
  pathContains?: string;
  text?: string;
  from?: string;
  to?: string;
}
