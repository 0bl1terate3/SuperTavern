import path from 'node:path';
import fs from 'node:fs';

import express from 'express';
import sanitize from 'sanitize-filename';
import { sync as writeFileAtomicSync } from 'write-file-atomic';
import { humanizedISO8601DateTime, generateTimestamp } from '../util.js';

export const router = express.Router();

// Create scheduled events
router.post('/create', (request, response) => {
    try {
        if (!request.body || !request.body.title || !request.body.datetime) {
            return response.status(400).json({ error: 'Title and datetime are required' });
        }

        const { title, datetime, description, type, reminder, recurring } = request.body;
        
        const event = {
            id: generateTimestamp(),
            title: title,
            datetime: datetime,
            description: description || '',
            type: type || 'event',
            reminder: reminder || null,
            recurring: recurring || null,
            created: humanizedISO8601DateTime(),
            completed: false,
        };

        const eventsFile = path.join(request.user.directories.root, 'schedule.json');
        let events = [];
        
        if (fs.existsSync(eventsFile)) {
            events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        }
        
        events.push(event);
        writeFileAtomicSync(eventsFile, JSON.stringify(events, null, 2), 'utf8');
        
        return response.json({ success: true, event });
    } catch (error) {
        console.error('Error creating scheduled event:', error);
        return response.status(500).json({ error: 'Failed to create event' });
    }
});

// Get all scheduled events
router.get('/all', (request, response) => {
    try {
        const eventsFile = path.join(request.user.directories.root, 'schedule.json');
        
        if (!fs.existsSync(eventsFile)) {
            return response.json([]);
        }
        
        const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        
        // Filter by date range if provided
        const { start, end } = request.query;
        let filteredEvents = events;
        
        if (start || end) {
            filteredEvents = events.filter(event => {
                const eventDate = new Date(event.datetime);
                if (start && eventDate < new Date(String(start))) return false;
                if (end && eventDate > new Date(String(end))) return false;
                return true;
            });
        }
        
        // Sort by datetime
        filteredEvents.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        
        return response.json(filteredEvents);
    } catch (error) {
        console.error('Error getting scheduled events:', error);
        return response.status(500).json({ error: 'Failed to get events' });
    }
});

// Update scheduled event
router.post('/update', (request, response) => {
    try {
        if (!request.body || !request.body.id) {
            return response.status(400).json({ error: 'Event ID is required' });
        }

        const eventsFile = path.join(request.user.directories.root, 'schedule.json');
        
        if (!fs.existsSync(eventsFile)) {
            return response.status(404).json({ error: 'No events found' });
        }
        
        const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        const eventIndex = events.findIndex(e => e.id === request.body.id);
        
        if (eventIndex === -1) {
            return response.status(404).json({ error: 'Event not found' });
        }
        
        // Update event properties
        const updatedEvent = { ...events[eventIndex], ...request.body, id: request.body.id };
        events[eventIndex] = updatedEvent;
        
        writeFileAtomicSync(eventsFile, JSON.stringify(events, null, 2), 'utf8');
        
        return response.json({ success: true, event: updatedEvent });
    } catch (error) {
        console.error('Error updating scheduled event:', error);
        return response.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete scheduled event
router.post('/delete', (request, response) => {
    try {
        if (!request.body || !request.body.id) {
            return response.status(400).json({ error: 'Event ID is required' });
        }

        const eventsFile = path.join(request.user.directories.root, 'schedule.json');
        
        if (!fs.existsSync(eventsFile)) {
            return response.status(404).json({ error: 'No events found' });
        }
        
        const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        const filteredEvents = events.filter(e => e.id !== request.body.id);
        
        if (filteredEvents.length === events.length) {
            return response.status(404).json({ error: 'Event not found' });
        }
        
        writeFileAtomicSync(eventsFile, JSON.stringify(filteredEvents, null, 2), 'utf8');
        
        return response.json({ success: true });
    } catch (error) {
        console.error('Error deleting scheduled event:', error);
        return response.status(500).json({ error: 'Failed to delete event' });
    }
});

// Get upcoming events (within next 7 days)
router.get('/upcoming', (request, response) => {
    try {
        const eventsFile = path.join(request.user.directories.root, 'schedule.json');
        
        if (!fs.existsSync(eventsFile)) {
            return response.json([]);
        }
        
        const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcomingEvents = events
            .filter(event => {
                const eventDate = new Date(event.datetime);
                return eventDate >= now && eventDate <= nextWeek && !event.completed;
            })
            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        
        return response.json(upcomingEvents);
    } catch (error) {
        console.error('Error getting upcoming events:', error);
        return response.status(500).json({ error: 'Failed to get upcoming events' });
    }
});
