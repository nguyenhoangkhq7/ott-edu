package fit.iuh.config;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.ollama.api.OllamaEmbeddingOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class OllamaConfig {

    // ── Connection Pooling ──

    @Bean
    public org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager ollamaConnectionManager(
            @Value("${app.ai.http.pool.max-total:50}") int maxTotal,
            @Value("${app.ai.http.pool.max-per-route:25}") int maxPerRoute,
            @Value("${app.ai.http.pool.connection-ttl-seconds:300}") int ttlSeconds) {
        return org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(maxTotal)
                .setMaxConnPerRoute(maxPerRoute)
                .setConnectionTimeToLive(org.apache.hc.core5.util.TimeValue.ofSeconds(ttlSeconds))
                .build();
    }

    @Bean
    public RestClient.Builder pooledRestClientBuilder(PoolingHttpClientConnectionManager cm) {
        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(cm)
                .evictIdleConnections(TimeValue.ofMinutes(5))
                .build();
        return RestClient.builder()
                .requestFactory(new HttpComponentsClientHttpRequestFactory(httpClient));
    }

    // ── Dual OllamaApi beans ──

    @Bean("cpuOllamaApi")
    public OllamaApi cpuOllamaApi(
            @Value("${app.ai.ollama.cpu.base-url}") String baseUrl,
            RestClient.Builder pooledRestClientBuilder) {
        return OllamaApi.builder()
                .baseUrl(baseUrl)
                .restClientBuilder(pooledRestClientBuilder)
                .build();
    }

    @Bean("gpuOllamaApi")
    public OllamaApi gpuOllamaApi(
            @Value("${app.ai.ollama.gpu.base-url}") String baseUrl,
            RestClient.Builder pooledRestClientBuilder) {
        return OllamaApi.builder()
                .baseUrl(baseUrl)
                .restClientBuilder(pooledRestClientBuilder)
                .build();
    }

    // ── Embedding Model (CPU Node) ──

    @Bean
    public OllamaEmbeddingModel embeddingModel(
            @Qualifier("cpuOllamaApi") OllamaApi cpuApi,
            @Value("${app.ai.ollama.cpu.model}") String model,
            @Value("${app.ai.ollama.cpu.keep-alive:1h}") String keepAlive) {
        return OllamaEmbeddingModel.builder()
                .ollamaApi(cpuApi)
                .defaultOptions(OllamaEmbeddingOptions.builder()
                        .model(model)
                        .keepAlive(keepAlive)
                        .build())
                .build();
    }

    // ── Chat Model (GPU Node) ──

    @Bean
    public OllamaChatModel chatModel(
            @Qualifier("gpuOllamaApi") OllamaApi gpuApi,
            @Value("${app.ai.ollama.gpu.model}") String model,
            @Value("${app.ai.ollama.gpu.keep-alive:-1m}") String keepAlive) {
        return OllamaChatModel.builder()
                .ollamaApi(gpuApi)
                .defaultOptions(OllamaChatOptions.builder()
                        .model(model)
                        .temperature(0.7)
                        .numCtx(8192)
                        .numPredict(2048)
                        .keepAlive(keepAlive)
                        .build())
                .build();
    }

    // ── ChatClient for Structured Output ──

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
