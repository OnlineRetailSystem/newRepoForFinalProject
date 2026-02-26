package com.ecom.orderservice.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.apache.hc.core5.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ecom.orderservice.clients.ProductClient;
import com.ecom.orderservice.dto.OrderResponseDTO;
import com.ecom.orderservice.dto.ProductDTO;
import com.ecom.orderservice.models.Order;
import com.ecom.orderservice.repositories.OrderRepository;

@RestController
@RequestMapping("/orders")
public class OrderController {
	
	private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
	
	@Autowired
    private OrderRepository orderRepository;
    
	@Autowired
	private ProductClient productClient;

	@PostMapping
	public ResponseEntity<?> placeOrder(@RequestBody Order order) {
	    try {
	        logger.info("Placing order for user: {}, productId: {}, quantity: {}", 
	            order.getUsername(), order.getProductId(), order.getQuantity());
	        
	        // Fetch product details
	        ProductDTO product = productClient.getProductById(order.getProductId());
	        if (product == null) {
	            logger.warn("Product not found for productId: {}", order.getProductId());
	            return ResponseEntity.badRequest().body("Product not found");
	        }
	        
	        if (order.getQuantity() > product.getQuantity()) {
	            logger.warn("Insufficient stock for productId: {}. Available: {}, Requested: {}", 
	                order.getProductId(), product.getQuantity(), order.getQuantity());
	            return ResponseEntity.badRequest().body("Insufficient stock");
	        }

	        // Reduce stock
	        productClient.reduceStock(order.getProductId(), order.getQuantity());

	        // Set totalPrice, orderDate, and category
	        order.setTotalPrice(product.getPrice() * order.getQuantity());
	        order.setOrderDate(LocalDateTime.now());
	        order.setCategory(product.getCategory());
	        // SET DEFAULT ORDER STATUS
	        if (order.getOrderStatus() == null) {
	            order.setOrderStatus("Pending");
	        }
	        // SET DEFAULT SHIPPING STATUS
	        if (order.getShippingStatus() == null) {
	            order.setShippingStatus("Pending");
	        }

	        // Save order
	        Order savedOrder = orderRepository.save(order);
	        logger.info("Order saved successfully with ID: {}", savedOrder.getId());

	        // Build response DTO
	        OrderResponseDTO responseDTO = new OrderResponseDTO(
	            savedOrder.getId(),
	            savedOrder.getUsername(),
	            savedOrder.getProductId(),
	            savedOrder.getCategory(),
	            savedOrder.getQuantity(),
	            savedOrder.getTotalPrice(),
	            savedOrder.getOrderDate(),
	            savedOrder.getOrderStatus(),
	            savedOrder.getShippingStatus()
	        );

	        return ResponseEntity.ok(responseDTO);
	    } catch (Exception e) {
	        logger.error("Error placing order: ", e);
	        return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
	            .body("Error placing order: " + e.getMessage());
	    }
	}

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(order -> {
                    orderRepository.delete(order);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/countbycategory")
    public ResponseEntity<List<Map<String, Object>>> getOrderCountByCategory() {
        List<Map<String, Object>> counts = orderRepository.countOrdersByCategory();
        return ResponseEntity.ok(counts);
    }
    
    @GetMapping("/countbystatus")
    public ResponseEntity<List<Map<String, Object>>> getOrderCountByStatus() {
        List<Map<String, Object>> counts = orderRepository.countOrdersByStatus();
        return ResponseEntity.ok(counts);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody Order updatedOrder) {
        try {
            // Find existing order
            return orderRepository.findById(id).map(existingOrder -> {
                // Optionally update fields; here assuming you'd want to update quantity
                // or other updatable fields. For demonstration, updating quantity and status:
                if (updatedOrder.getQuantity() != null) {
                    existingOrder.setQuantity(updatedOrder.getQuantity());
                }
                if (updatedOrder.getOrderStatus() != null) {
                    existingOrder.setOrderStatus(updatedOrder.getOrderStatus());
                }
                if (updatedOrder.getShippingStatus() != null) {
                    existingOrder.setShippingStatus(updatedOrder.getShippingStatus());
                }
                // If other fields are updatable, handle them similarly.
                // Note: You might need to update totalPrice if quantity changes.
                // Fetch product details if quantity or productId is updated, and recalculate totalPrice
                if (updatedOrder.getQuantity() != null || (updatedOrder.getProductId() != null)) {
                    Long productIdToUse = updatedOrder.getProductId() != null ? updatedOrder.getProductId() : existingOrder.getProductId();
                    ProductDTO product = productClient.getProductById(productIdToUse);
                    if (product == null) {
                        return ResponseEntity.badRequest().body("Product not found");
                    }
                    int quantity = updatedOrder.getQuantity() != null ? updatedOrder.getQuantity() : existingOrder.getQuantity();
                    if (quantity > product.getQuantity()) {
                        return ResponseEntity.badRequest().body("Insufficient stock");
                    }
                    // Reduce stock if quantity changed (assuming you want to decrease stock accordingly)
                    productClient.reduceStock(productIdToUse, quantity - existingOrder.getQuantity());

                    existingOrder.setTotalPrice(product.getPrice() * quantity);
                    existingOrder.setProductId(productIdToUse);
                    existingOrder.setCategory(product.getCategory());
                    existingOrder.setOrderDate(LocalDateTime.now()); // Update order date on modification
                }
                // Save the updated order
                Order savedOrder = orderRepository.save(existingOrder);
                return ResponseEntity.ok(savedOrder);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating order: ", e);
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR).body("Error updating order: " + e.getMessage());
        }
    }
}
