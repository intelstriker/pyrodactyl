import http from '@/api/http';

export interface ServerMetric {
    timestamp: string;
    cpu_absolute: number;
    memory_bytes: number;
    disk_bytes: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
    state?: string | null;
}

export interface ServerMetricsResponse {
    object: string;
    data: ServerMetric[];
    meta?: {
        period: string;
        count: number;
        start: string;
        end: string;
    };
}

export type MetricPeriod = 'live' | '1h' | '24h' | '7d' | '30d';

export default (server: string, period: MetricPeriod = '1h'): Promise<ServerMetricsResponse> => {
    return http
        .get(`/api/client/servers/${server}/metrics`, {
            params: { period },
        })
        .then(({ data }) => data);
};
