package fit.iuh.modules.auth.services.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpEmailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public OtpEmailService(JavaMailSender mailSender, @Value("${app.mail.from:no-reply@teams-connect.local}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    public void sendOtp(String recipient, String otpCode, String purposeLabel, long ttlSeconds) {
        long ttlMinutes = Math.max(1, ttlSeconds / 60);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(recipient);
        message.setSubject("[Teams Connect] Ma xac thuc OTP");
        message.setText(buildBody(otpCode, purposeLabel, ttlMinutes));

        mailSender.send(message);
    }

    private String buildBody(String otpCode, String purposeLabel, long ttlMinutes) {
        return "Xin chao,\n\n"
                + "Ban vua yeu cau " + purposeLabel + ".\n"
                + "Ma OTP cua ban la: " + otpCode + "\n"
                + "Ma co hieu luc trong " + ttlMinutes + " phut.\n\n"
                + "Neu ban khong thuc hien yeu cau nay, vui long bo qua email.\n\n"
                + "Teams Connect";
    }
}
