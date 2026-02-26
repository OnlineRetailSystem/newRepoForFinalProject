package com.example.stripepayment.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

	@PostMapping("/create")
	public ResponseEntity<Map<String, String>> createPayment(@RequestBody Map<String, Object> data) throws StripeException {
	    Object amountObj = data.get("amount");
	    Long amount;
	    if (amountObj instanceof Number) {
	        amount = ((Number) amountObj).longValue();
	    } else if (amountObj instanceof String) {
	        amount = Long.parseLong((String) amountObj);
	    } else {
	        return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount"));
	    }
	    String currency = "usd"; // fixed for now

	    PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
	        .setAmount(amount)
	        .setCurrency(currency)
	        .build();

	    PaymentIntent intent = PaymentIntent.create(params);
	    Map<String, String> response = new HashMap<>();
	    response.put("clientSecret", intent.getClientSecret());
	    return ResponseEntity.ok(response);
	}
}