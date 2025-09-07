# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Kafka Management UI built with React 19, Next.js 15, TypeScript, and TailwindCSS. The application provides a comprehensive interface for managing and monitoring Apache Kafka clusters, including brokers, topics, producers, and consumers.

## Technology Stack

- **Frontend**: React 19 with Next.js 15 App Router
- **Language**: TypeScript with strict mode
- **Styling**: TailwindCSS utility-first framework
- **State Management**: React Context or Zustand (to be determined during implementation)
- **Real-time Updates**: WebSockets or Server-Sent Events

## Development Commands

Since this is a new project, the following commands will be established during setup:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture Overview

### Core Application Structure

The application follows a component-based architecture with these main areas:

1. **Cluster Management**: Connection handling, health monitoring, and cluster overview dashboard
2. **Broker Management**: Broker status, configurations, and performance metrics
3. **Topic Management**: CRUD operations, partition management, and topic metrics
4. **Producer Monitoring**: Active producers, performance metrics, and message production rates
5. **Consumer Management**: Consumer groups, lag monitoring, and offset management

### Key Technical Patterns

- **Real-time Data Flow**: WebSocket connections for live metrics and status updates
- **API Integration**: RESTful client with caching, error handling, and retry logic
- **State Management**: Centralized state for cluster connections and real-time data
- **Component Architecture**: Reusable UI components with proper separation of concerns

### Connection Management

The application connects to Kafka clusters via bootstrap servers (localhost:9092 for local development) and supports multiple cluster profiles with connection health monitoring.

### UI/UX Architecture

- **Responsive Design**: Desktop-first approach with mobile-friendly adaptations
- **Theme Support**: Dark/light theme toggle implementation
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation
- **Component Library**: Custom components including data tables, modals, and real-time metrics cards

## Development Environment

### Local Kafka Setup

The project includes Docker Compose configuration for local Kafka cluster development with proper environment configuration for different endpoints.

### Code Quality Standards

- ESLint and Prettier configuration
- Husky pre-commit hooks
- React Testing Library for component testing
- Type-safe API client patterns

### Performance Considerations

- Optimistic UI updates for better user experience
- Request/response caching strategies
- Connection retry logic with exponential backoff
- Real-time updates without performance degradation

## Key Development Areas

When working on this codebase, focus on these architectural patterns:

1. **Custom Hooks**: Create reusable hooks for Kafka API interactions
2. **Error Boundaries**: Implement proper error handling throughout the application
3. **Loading States**: Consistent loading indicators across all components
4. **Toast Notifications**: User feedback system for operations
5. **Modal Management**: Centralized modal state for configuration dialogs

## Future Architecture Considerations

The codebase is designed to support future enhancements including Schema Registry integration, Kafka Connect management, multi-cluster support, and user authentication systems.

# Collaboration

- Please stop when a complete step is done so that I can read and review the code.
- Please add more comments to elaborate the design and implementation, not line comments for each line of code, but for the main tech regarding TailwindCSS, React, Next.js, Frontend Architecture etc.:
  - explain the class names of TailwindCSS
  - explain React design
  - explian Next.js design, layout, routing etc.
