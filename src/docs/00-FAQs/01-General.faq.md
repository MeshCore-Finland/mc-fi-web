---
slug: general
title: General
---

# General FAQ

Short answers to common MeshCore & Finnish mesg questions. If you have additions, submit a PR on GitHub.


## What is MeshCore Finland?

MeshCore Finland is a community site by Finnish entusiasts and you can find similar sites in most other countries where MeshCore is present. The official MeshCore website is at [meshcore.io](https://meshcore.io).


## What are the MeshCore settings (EU/UK Narrow) in Finland? 

We use the **EU/UK Narrow** preset like almost all of Europe.

- Frequency: 869.618 MHz
- Bandwidth: 62.5 kHz
- SF: 8
- CR: 8


## I flashed a MeshCore commpanion hours ago and nobody appears in my contacts?

This is normal. Contacts are discovered from ADVERT packets which advertise a node's identity and
possibly location. Both companions and repeaters can advert. So why is nobody showing up'? It is due to the principles of a quiet & private mesh.

- **Companions** do not advert unless the user actively chooses to do so. So there might be other users nearby but they don't want to make noise about it.
- **Repeaters** typically advert periodically but the default is 47 hours. Repeater adverts are
purely informational, you do not need to hear an advert from a repeater to use it.

So just turning on a node and passively waiting for friends is going to take some time.

## How do I find repeaters and other users? How do I know if my messages are heard?

You have some solid options:
- Send a message on a public channel to say hi (Public and #finland are good candidates). Your companion will report how many repeaters it heard repeating your message. Someone might reply even
though we are mostly Finnish.
- The phone app / device firmaware typically has a tool to discover repeaters. This will send out a request which all repeaters in range will answer.
- Send an advert from your phone if you want to be seen without smalltalk

## Why is everyone on Public speaking Estonian or Latvian?

So you are probably in Helsinki region and it's not raining. Welcome! Our mesh is connected over the Gulf of Finland to Tallinn and other repeaters on the Estonian coast. Estonia is connected to Latvia, Lithuania, Poland and beyond. This long-range connectivity is very weather dependent and can appear and disappear very quickly.


## Can I make my Companion node also a Repeater?
 
No. Yes. Companion nodes do not normally repeat. This is a core design decision in MeshCore.

BUT there is an exception. If you are a group and completely off the mesh (for example hiking), you can enable the special Off-Grid mode on your Companions. In this mode:
- Companions will switch to a special off-the-grid frequency which is NOT the same as the normal MC frequency. You are forming a separate mesh now.
- Companions **will** now repeat every packet they hear
- See the [MeshCore Blog](https://blog.meshcore.io/2026/02/13/off-grid-client-repeat-mode) for details.

Note: You do **not** need to enable this mode to message between Companions that can directly hear each other. Direct communication always works even without Repeaters. You also can take a repeater with you and haul it up a tree at base camp and keep normal settings.


## Do I need permission to set up a Repeater? Where can I put one?

Put a repeater wherever you want.

- No permission needed, this is an open mesh. If you want to increase coverage, add a repeater.
- There is only one Repeater "role" whether you put it on a mountain top or your livingroom window.
You don't need to worry about what is the correct type of Repeater, there is only one.
- You can name your repeater whatever you want but some hint at location is appreciated. And play nice.
- A very typical use case is to put a repeater on your roof or balcony to get coverage inside the home. At the same time you add coverage to the neighborhood.


## Can I put a Repeater on my car?

Mobile repeaters are a bit of an evolving topic. Originally they were discouraged because in MeshCore nodes learn the routes between each other by recording the repeaters they need to travel through. Then they can use DIRECT routing to have only those repeaters repeat the packetss, reducing the need to send flood packets which will spread through the network like wildfire.

Thus having a mobile repeater could make that repeater get recorded in paths that are then no longer valid when the repeater moves or gets turned off. This causes futile DIRECT mode tries until the sender falls back to FLOOD routing to discover a new route.

So some people will say don't do it, others will say the damage is minimal and rare.

Note: It's of course perfectly ok to go to a picnic and set up a repeater there for a few hours. It will be a temporary hop but not one that disappears almost as soon as it appeared.

