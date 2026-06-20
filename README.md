# CineFlow – Real-Time Movie Booking Platform

A full-stack **movie ticket booking system** built with modern technologies, featuring **Role-Based Access Control (RBAC)**, real-time seat booking, and secure payment integration.

## Features

- **Admin Panel**: Add, update, and manage Movies, Theatres, and Shows
- **User Features**: Browse movies, view show timings, select seats, and book tickets
- **Real-Time Seat Booking** with **Redis** distributed locking (prevents double booking)
- **Secure Authentication** using **JWT** + SHA256 password hashing
- **RBAC**: Separate access for Users and Admins
- **Payment Integration** with **Stripe** (Payment Intent + Webhooks)
- **High-Performance Backend** using Node.js, Express, MongoDB & Redis caching
- Scalable architecture with proper error handling and security best practices

## Tech Stack

**Backend**: Node.js | Express | MongoDB | Mongoose | Redis | JWT | Stripe  
**Frontend** (Planned / In Progress): React | Redux | Tailwind CSS

## Key Highlights

- Admin-only routes for managing content
- Redis-based concurrency control for seat availability
- Production-ready structure with consistent error handling
- Fully RESTful APIs with proper validation and security

Built as a **portfolio project** to demonstrate strong full-stack development, performance optimization, and real-world system design skills.

---

**Live Demo** | **Frontend Repository** | **API Documentation**
