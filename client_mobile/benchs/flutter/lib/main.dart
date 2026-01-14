import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AREA Benchmark',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const ServicesPage(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class ServicesPage extends StatelessWidget {
  const ServicesPage({super.key});

  final List<Map<String, dynamic>> services = const [
    {
      "id": 1,
      "name": "Google",
      "description": "Connect your email and drive",
      "color": Colors.red,
      "icon": Icons.g_mobiledata
    },
    {
      "id": 2,
      "name": "Discord",
      "description": "Post messages to channels",
      "color": Colors.indigo,
      "icon": Icons.discord
    },
    {
      "id": 3,
      "name": "Spotify",
      "description": "Track your favorite music",
      "color": Colors.green,
      "icon": Icons.music_note
    },
    {
      "id": 4,
      "name": "YTmusic",
      "description": "Track your favorite music",
      "color": Colors.green,
      "icon": Icons.music_note
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AREA Benchmark',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.blue,
        centerTitle: true,
      ),
      body: Container(
        color: Colors.grey[100], // Light grey background like the React Native one
        child: ListView.builder(
          padding: const EdgeInsets.all(10),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return Card(
              elevation: 4,
              margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              child: Padding(
                padding: const EdgeInsets.all(15.0),
                child: Row(
                  children: [
                    // Icon/Color Square
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: service['color'] as Color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        service['icon'] as IconData,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 15),
                    // Text Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            service['name'] as String,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            service['description'] as String,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
