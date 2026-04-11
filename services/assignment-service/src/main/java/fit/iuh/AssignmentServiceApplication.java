package fit.iuh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = { "fit.iuh", "create_assignment", "assign_homework", "scoring_feedback", "view_results", "submission" })
@EnableJpaRepositories(basePackages = { "fit.iuh", "create_assignment", "assign_homework", "scoring_feedback", "view_results", "submission" })
@EntityScan(basePackages = { "fit.iuh", "create_assignment", "assign_homework", "scoring_feedback", "view_results", "submission" })
@EnableFeignClients(basePackages = { "assign_homework" })
@EnableAsync
public class AssignmentServiceApplication {

   public static void main(String[] args) {
      SpringApplication.run(AssignmentServiceApplication.class, args);
   }

}
