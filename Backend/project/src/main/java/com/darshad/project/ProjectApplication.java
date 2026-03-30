package com.darshad.project;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class ProjectApplication {

    private static final Logger log = LoggerFactory.getLogger(ProjectApplication.class);

    private final Environment env;

    public ProjectApplication(Environment env) {
        this.env = env;
    }

    public static void main(String[] args) {
        SpringApplication.run(ProjectApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        String port = env.getProperty("server.port", "8080");
        String profile = String.join(", ", env.getActiveProfiles());
        String dbUrl = env.getProperty("spring.datasource.url", "N/A");

        log.info("╔══════════════════════════════════════════════════╗");
        log.info("║          Aqyldy Sauda Sebeti — READY            ║");
        log.info("╠══════════════════════════════════════════════════╣");
        log.info("║  Port:     {}                              ", port);
        log.info("║  Profile:  {}                              ", profile);
        log.info("║  DB:       {}  ", dbUrl);
        log.info("║  Swagger:  http://localhost:{}/swagger      ", port);
        log.info("║  API Docs: http://localhost:{}/api-docs     ", port);
        log.info("╚══════════════════════════════════════════════════╝");
    }
}
