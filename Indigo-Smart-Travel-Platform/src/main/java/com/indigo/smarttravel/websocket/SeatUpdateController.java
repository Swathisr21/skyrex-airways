package com.indigo.smarttravel.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class SeatUpdateController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // In-memory store for seat selections per flight (flightId -> seatId -> userId)
    private final Map<Long, Map<String, String>> flightSeatSelections = new ConcurrentHashMap<>();

    /**
     * Handle seat selection from a client
     */
    @MessageMapping("/seat/select/{flightId}")
    public void handleSeatSelection(@DestinationVariable Long flightId, @Payload SeatUpdateMessage message) {
        message.setFlightId(flightId);
        message.setAction("SELECT");
        
        // Track the selection
        flightSeatSelections.computeIfAbsent(flightId, k -> new ConcurrentHashMap<>())
                .put(message.getSelectedSeats().get(0), message.getUserId());

        // Broadcast to all subscribers for this flight
        messagingTemplate.convertAndSend("/topic/seats/" + flightId, message);
    }

    /**
     * Handle seat deselection from a client
     */
    @MessageMapping("/seat/deselect/{flightId}")
    public void handleSeatDeselection(@DestinationVariable Long flightId, @Payload SeatUpdateMessage message) {
        message.setFlightId(flightId);
        message.setAction("DESELECT");
        
        // Remove the selection tracking
        Map<String, String> selections = flightSeatSelections.get(flightId);
        if (selections != null && message.getSelectedSeats() != null) {
            for (String seatId : message.getSelectedSeats()) {
                selections.remove(seatId);
            }
        }

        // Broadcast to all subscribers for this flight
        messagingTemplate.convertAndSend("/topic/seats/" + flightId, message);
    }

    /**
     * Handle seat confirmation (booking completed)
     */
    @MessageMapping("/seat/confirm/{flightId}")
    public void handleSeatConfirmation(@DestinationVariable Long flightId, @Payload SeatUpdateMessage message) {
        message.setFlightId(flightId);
        message.setAction("CONFIRM");
        
        // Remove from pending selections
        Map<String, String> selections = flightSeatSelections.get(flightId);
        if (selections != null && message.getSelectedSeats() != null) {
            for (String seatId : message.getSelectedSeats()) {
                selections.remove(seatId);
            }
        }

        // Broadcast to all subscribers for this flight
        messagingTemplate.convertAndSend("/topic/seats/" + flightId, message);
    }

    /**
     * Handle seat release (booking cancelled or session expired)
     */
    @MessageMapping("/seat/release/{flightId}")
    public void handleSeatRelease(@DestinationVariable Long flightId, @Payload SeatUpdateMessage message) {
        message.setFlightId(flightId);
        message.setAction("RELEASE");
        
        // Remove from pending selections
        Map<String, String> selections = flightSeatSelections.get(flightId);
        if (selections != null && message.getSelectedSeats() != null) {
            for (String seatId : message.getSelectedSeats()) {
                selections.remove(seatId);
            }
        }

        // Broadcast to all subscribers for this flight
        messagingTemplate.convertAndSend("/topic/seats/" + flightId, message);
    }

    /**
     * Send a heartbeat/ping to keep connections alive and sync state
     */
    @MessageMapping("/seat/sync/{flightId}")
    public void handleSeatSync(@DestinationVariable Long flightId, @Payload SeatUpdateMessage message) {
        Map<String, String> selections = flightSeatSelections.get(flightId);
        
        SeatUpdateMessage syncMessage = new SeatUpdateMessage();
        syncMessage.setFlightId(flightId);
        syncMessage.setAction("SYNC");
        syncMessage.setSelectedSeats(selections != null ? 
                selections.keySet().stream().toList() : null);
        
        messagingTemplate.convertAndSend("/topic/seats/" + flightId, syncMessage);
    }
}
