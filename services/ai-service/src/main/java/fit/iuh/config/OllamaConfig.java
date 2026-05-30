package fit.iuh.config;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class OllamaConfig {

    // ── Connection Pooling ──

    @Bean
    public PoolingHttpClientConnectionManager ollamaConnectionManager(
            @Value("${app.ai.http.pool.max-total:50}") int maxTotal,
            @Value("${app.ai.http.pool.max-per-route:25}") int maxPerRoute,
            @Value("${app.ai.http.pool.connection-ttl-seconds:300}") int ttlSeconds) {
        return PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(maxTotal)
                .setMaxConnPerRoute(maxPerRoute)
                .setConnectionTimeToLive(TimeValue.ofSeconds(ttlSeconds))
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

    // ── OllamaApi bean ──

    @Bean
    public OllamaApi ollamaApi(
            @Value("${app.ai.ollama.base-url}") String baseUrl,
            RestClient.Builder pooledRestClientBuilder) {
        return OllamaApi.builder()
                .baseUrl(baseUrl)
                .restClientBuilder(pooledRestClientBuilder)
                .build();
    }

    // ── Chat Model ──

    @Bean
    public OllamaChatModel chatModel(
            OllamaApi ollamaApi,
            @Value("${app.ai.ollama.model}") String model,
            @Value("${app.ai.ollama.keep-alive:-1m}") String keepAlive) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
                .defaultOptions(OllamaChatOptions.builder()
                        .model(model)
                        .temperature(0.1)
                        .numCtx(2048)
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
