package com.indigo.smarttravel.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.Flight;
import com.indigo.smarttravel.entity.User;
import com.indigo.smarttravel.repository.BookingRepository;
import com.indigo.smarttravel.repository.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    public void sendSimpleEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("bookings@indigo.com");
        mailSender.send(message);
    }

    public void sendBookingConfirmationEmail(Long bookingId) throws MessagingException {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User user = userRepository.findById(booking.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Flight flight = booking.getFlight();

        String htmlBody = buildBookingConfirmationHtml(booking, flight, user);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(user.getEmail());
        helper.setSubject("Booking Confirmation - " + booking.getBookingReference());
        helper.setText(htmlBody, true);
        helper.setFrom("bookings@indigo.com");

        mailSender.send(message);
    }

    private String buildBookingConfirmationHtml(Booking booking, Flight flight, User user) {
        return "<html>" +
                "<head><style>" +
                "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                ".header { background-color: #003366; color: white; padding: 20px; text-align: center; }" +
                ".content { padding: 20px; }" +
                ".booking-details { background-color: #f4f4f4; padding: 15px; margin: 15px 0; border-radius: 5px; }" +
                ".flight-details { background-color: #e8f4f8; padding: 15px; margin: 15px 0; border-radius: 5px; }" +
                ".footer { background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }" +
                "</style></head>" +
                "<body>" +
                "<div class='header'><h1>Indigo Airlines</h1><p>Booking Confirmation</p></div>" +
                "<div class='content'>" +
                "<p>Dear " + user.getName() + ",</p>" +
                "<p>Your booking has been confirmed. Here are your booking details:</p>" +
                "<div class='booking-details'>" +
                "<h3>Booking Reference: " + booking.getBookingReference() + "</h3>" +
                "<p><strong>Passenger:</strong> " + booking.getPassengerName() + "</p>" +
                "<p><strong>Seats:</strong> " + booking.getSelectedSeats() + "</p>" +
                "<p><strong>Total Amount:</strong> Rs. " + booking.getTotalAmount() + "</p>" +
                "<p><strong>Status:</strong> " + booking.getStatus() + "</p>" +
                "</div>" +
                "<div class='flight-details'>" +
                "<h3>Flight Details</h3>" +
                "<p><strong>Flight:</strong> " + flight.getFlightNumber() + "</p>" +
                "<p><strong>Route:</strong> " + flight.getSource() + " → " + flight.getDestination() + "</p>" +
                "<p><strong>Departure:</strong> " + flight.getDepartureTime() + "</p>" +
                "<p><strong>Arrival:</strong> " + flight.getArrivalTime() + "</p>" +
                "</div>" +
                "<p>Please present your booking reference at check-in.</p>" +
                "<br/><br/>" +
                "<div class='footer'>" +
                "<p>Thank you for flying with Indigo!</p>" +
                "<p>For any queries, contact us at support@indigo.com</p>" +
                "</div>" +
                "</div>" +
                "</body></html>";
    }

    public void sendTestEmail(String to) {
        sendSimpleEmail(to, "Indigo Test Email", "This is a test email from Indigo Smart Travel Platform. Email service is working!");
    }

    public com.indigo.smarttravel.entity.Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }
}