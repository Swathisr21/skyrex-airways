package com.indigo.smarttravel.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.indigo.smarttravel.entity.Airport;
import com.indigo.smarttravel.entity.Coupon;
import com.indigo.smarttravel.entity.Flight;
import com.indigo.smarttravel.entity.User;
import com.indigo.smarttravel.repository.AirportRepository;
import com.indigo.smarttravel.repository.CouponRepository;
import com.indigo.smarttravel.repository.FlightRepository;
import com.indigo.smarttravel.repository.UserRepository;

@Component
public class DataLoader implements CommandLineRunner {

    private final FlightRepository flightRepository;
    private final AirportRepository airportRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(FlightRepository flightRepository,
                      AirportRepository airportRepository,
                      CouponRepository couponRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {


        this.passwordEncoder = passwordEncoder;
        this.flightRepository = flightRepository;
        this.airportRepository = airportRepository;
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        loadAirports();
        loadFlights();
        loadCoupons();
        loadUsers();
    }

    private void loadAirports() {
        if (airportRepository.count() > 0) return;

        String[][] airports = {
            {"Delhi", "DEL", "Indira Gandhi International Airport", "India"},
            {"Mumbai", "BOM", "Chhatrapati Shivaji Maharaj International Airport", "India"},
            {"Bangalore", "BLR", "Kempegowda International Airport", "India"},
            {"Hyderabad", "HYD", "Rajiv Gandhi International Airport", "India"},
            {"Chennai", "MAA", "Chennai International Airport", "India"},
            {"Kolkata", "CCU", "Netaji Subhas Chandra Bose International Airport", "India"},
            {"Pune", "PNQ", "Pune Airport", "India"},
            {"Jaipur", "JAI", "Jaipur International Airport", "India"},
            {"Ahmedabad", "AMD", "Sardar Vallabhbhai Patel International Airport", "India"},
            {"Goa", "GOI", "Goa International Airport", "India"}
        };

        for (String[] a : airports) {
            Airport airport = new Airport();
            airport.setCity(a[0]);
            airport.setCode(a[1]);
            airport.setName(a[2]);
            airport.setCountry(a[3]);
            airportRepository.save(airport);
        }
    }

    private void loadFlights() {
        if (flightRepository.count() > 0) return;

        // Routes: source, destination, base departure time, base arrival time, base price
        Object[][] routes = {
            {"Delhi", "Mumbai", "06:00", "08:15", 4500},
            {"Delhi", "Bangalore", "07:30", "10:15", 5200},
            {"Delhi", "Hyderabad", "08:00", "10:00", 4800},
            {"Delhi", "Chennai", "09:00", "11:45", 5500},
            {"Delhi", "Kolkata", "10:00", "12:10", 4200},
            {"Delhi", "Pune", "11:00", "13:10", 4700},
            {"Delhi", "Jaipur", "12:00", "12:50", 2800},
            {"Delhi", "Ahmedabad", "13:00", "14:40", 3900},
            {"Delhi", "Goa", "14:00", "16:45", 5800},

            {"Mumbai", "Delhi", "06:30", "08:45", 4600},
            {"Mumbai", "Bangalore", "07:00", "08:45", 3800},
            {"Mumbai", "Hyderabad", "08:30", "09:50", 3500},
            {"Mumbai", "Chennai", "09:30", "11:15", 4100},
            {"Mumbai", "Kolkata", "10:30", "13:15", 5200},
            {"Mumbai", "Pune", "11:30", "12:20", 2200},
            {"Mumbai", "Goa", "12:30", "13:30", 3200},

            {"Bangalore", "Delhi", "06:00", "08:45", 5300},
            {"Bangalore", "Mumbai", "07:00", "08:50", 3900},
            {"Bangalore", "Hyderabad", "08:00", "09:15", 2800},
            {"Bangalore", "Chennai", "09:00", "10:00", 2500},
            {"Bangalore", "Kolkata", "10:00", "12:30", 5100},
            {"Bangalore", "Pune", "11:00", "12:30", 3600},
            {"Bangalore", "Goa", "12:00", "13:15", 3100},

            {"Hyderabad", "Delhi", "06:00", "08:00", 4900},
            {"Hyderabad", "Mumbai", "07:00", "08:20", 3600},
            {"Hyderabad", "Bangalore", "08:00", "09:15", 2900},
            {"Hyderabad", "Chennai", "09:00", "10:10", 2700},
            {"Hyderabad", "Kolkata", "10:00", "12:15", 4700},

            {"Chennai", "Delhi", "06:00", "08:45", 5600},
            {"Chennai", "Mumbai", "07:00", "08:50", 4200},
            {"Chennai", "Bangalore", "08:00", "09:00", 2600},
            {"Chennai", "Hyderabad", "09:00", "10:10", 2800},
            {"Chennai", "Kolkata", "10:00", "12:20", 4300},

            {"Kolkata", "Delhi", "06:00", "08:10", 4300},
            {"Kolkata", "Mumbai", "07:00", "09:45", 5300},
            {"Kolkata", "Bangalore", "08:00", "10:30", 5200},
            {"Kolkata", "Chennai", "09:00", "11:20", 4400},
            {"Kolkata", "Hyderabad", "10:00", "12:15", 4600},

            {"Pune", "Delhi", "06:00", "08:10", 4800},
            {"Pune", "Mumbai", "07:00", "07:50", 2300},
            {"Pune", "Bangalore", "08:00", "09:30", 3700},

            {"Jaipur", "Delhi", "06:00", "06:50", 2900},
            {"Jaipur", "Mumbai", "07:00", "09:10", 4200},

            {"Ahmedabad", "Delhi", "06:00", "07:40", 4000},
            {"Ahmedabad", "Mumbai", "08:00", "09:15", 3100},

            {"Goa", "Delhi", "06:00", "08:45", 5900},
            {"Goa", "Mumbai", "09:00", "10:00", 3300},
            {"Goa", "Bangalore", "11:00", "12:15", 3200}
        };

        LocalDate today = LocalDate.now();

        int flightIndex = 1;

for (int dayOffset = 0; dayOffset < 30; dayOffset++) {
    LocalDate travelDate = today.plusDays(dayOffset);

            for (Object[] route : routes) {
                String source = (String) route[0];
                String destination = (String) route[1];
                LocalTime depTime = LocalTime.parse((String) route[2]);
                LocalTime arrTime = LocalTime.parse((String) route[3]);
                int basePrice = (int) route[4];

                // Vary price slightly by day
                int priceVariation = (dayOffset % 7) * 50;
                int finalPrice = basePrice + priceVariation;

                Flight flight = new Flight();
                flight.setFlightNumber("6E-" + String.format("%03d", flightIndex));
                flight.setSource(source);
                flight.setDestination(destination);
                flight.setDepartureTime(LocalDateTime.of(travelDate, depTime));
                flight.setArrivalTime(LocalDateTime.of(travelDate, arrTime));
                flight.setPrice(BigDecimal.valueOf(finalPrice));
                flight.setAvailableSeats(180);
                flight.setTravelDate(travelDate);
                flight.setAirline("Indigo");
                flight.setStatus("ON_TIME");

                flightRepository.save(flight);
                flightIndex++;
            }
        }
    }

    private void loadCoupons() {
        if (couponRepository.count() > 0) return;

        Coupon c1 = new Coupon();
        c1.setCode("WELCOME20");
        c1.setDiscountPercentage(BigDecimal.valueOf(20));
        c1.setCouponType("PERCENTAGE");
        c1.setActive(true);
        couponRepository.save(c1);

        Coupon c2 = new Coupon();
        c2.setCode("INDIGO10");
        c2.setDiscountPercentage(BigDecimal.valueOf(10));
        c2.setCouponType("PERCENTAGE");
        c2.setActive(true);
        couponRepository.save(c2);

        Coupon c3 = new Coupon();
        c3.setCode("SUMMER15");
        c3.setDiscountPercentage(BigDecimal.valueOf(15));
        c3.setCouponType("PERCENTAGE");
        c3.setActive(true);
        couponRepository.save(c3);
    }

    private void loadUsers() {
        if (userRepository.count() > 0) return;

        User user = new User();
        user.setName("Test User");
        user.setEmail("test@Skyrex.com");
        user.setPassword(passwordEncoder.encode("test123"));        user.setRole("USER");
        userRepository.save(user);
    }
}
