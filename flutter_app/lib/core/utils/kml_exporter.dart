import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/gps_service.dart';

class KmlExporter {
  static String _header(String name) => '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>$name</name>
    <Style id="trackLine">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    <Style id="startMarker">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.2</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-blank.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="endMarker">
      <IconStyle>
        <color>ffff0000</color>
        <scale>1.2</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-blank.png</href></Icon>
      </IconStyle>
    </Style>
''';

  static String _placemark(String name, double lat, double lng, String styleId, Map<String, String>? extra) {
    final buf = StringBuffer();
    buf.writeln('    <Placemark>');
    buf.writeln('      <name>$name</name>');
    buf.writeln('      <styleUrl>#$styleId</styleUrl>');
    if (extra != null) {
      buf.writeln('      <ExtendedData>');
      extra.forEach((k, v) {
        buf.writeln('        <Data name="$k"><value>$v</value></Data>');
      });
      buf.writeln('      </ExtendedData>');
    }
    buf.writeln('      <Point><coordinates>$lng,$lat,0</coordinates></Point>');
    buf.writeln('    </Placemark>');
    return buf.toString();
  }

  static String _track(List<TrackedPoint> points) {
    final buf = StringBuffer();
    buf.writeln('    <Placemark>');
    buf.writeln('      <name>GPS Track</name>');
    buf.writeln('      <styleUrl>#trackLine</styleUrl>');
    buf.writeln('      <LineString>');
    buf.writeln('        <extrude>1</extrude>');
    buf.writeln('        <tessellate>1</tessellate>');
    buf.writeln('        <coordinates>');
    for (final p in points) {
      buf.writeln('          ${p.longitude},${p.latitude},${p.altitude ?? 0}');
    }
    buf.writeln('        </coordinates>');
    buf.writeln('      </LineString>');
    buf.writeln('    </Placemark>');
    return buf.toString();
  }

  static String _polygon(List<TrackedPoint> points) {
    if (points.length < 3) return '';
    final buf = StringBuffer();
    buf.writeln('    <Placemark>');
    buf.writeln('      <name>Coverage Area</name>');
    buf.writeln('      <Polygon>');
    buf.writeln('        <outerBoundaryIs><LinearRing><coordinates>');
    for (final p in points) {
      buf.writeln('          ${p.longitude},${p.latitude},${p.altitude ?? 0}');
    }
    buf.writeln('          ${points.first.longitude},${points.first.latitude},${points.first.altitude ?? 0}');
    buf.writeln('        </coordinates></LinearRing></outerBoundaryIs>');
    buf.writeln('      </Polygon>');
    buf.writeln('    </Placemark>');
    return buf.toString();
  }

  static String _footer() => '  </Document>\n</kml>';

  static String generateKml({
    required String name,
    required List<TrackedPoint> points,
    required double totalDistanceKm,
    required double areaSqMeters,
    required Duration duration,
  }) {
    final buf = StringBuffer();
    buf.writeln(_header(name));

    if (points.isNotEmpty) {
      buf.write(_placemark('Start', points.first.latitude, points.first.longitude, 'startMarker', {
        'time': points.first.timestamp.toIso8601String(),
      }));
      buf.write(_placemark('End', points.last.latitude, points.last.longitude, 'endMarker', {
        'time': points.last.timestamp.toIso8601String(),
      }));
    }

    buf.write(_track(points));
    buf.write(_polygon(points));

    buf.writeln('    <ExtendedData>');
    buf.writeln('      <Data name="TotalDistanceKm"><value>${totalDistanceKm.toStringAsFixed(3)}</value></Data>');
    buf.writeln('      <Data name="AreaSqMeters"><value>${areaSqMeters.toStringAsFixed(1)}</value></Data>');
    buf.writeln('      <Data name="DurationSeconds"><value>${duration.inSeconds}</value></Data>');
    buf.writeln('      <Data name="PointCount"><value>${points.length}</value></Data>');
    buf.writeln('    </ExtendedData>');

    buf.writeln(_footer());
    return buf.toString();
  }

  static Future<File> saveKmlFile({
    required String name,
    required String kmlContent,
  }) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$name.kml');
    await file.writeAsString(kmlContent);
    return file;
  }

  static Future<void> shareKml({
    required String name,
    required List<TrackedPoint> points,
    required double totalDistanceKm,
    required double areaSqMeters,
    required Duration duration,
  }) async {
    final kml = generateKml(
      name: name,
      points: points,
      totalDistanceKm: totalDistanceKm,
      areaSqMeters: areaSqMeters,
      duration: duration,
    );
    final file = await saveKmlFile(name: name.replaceAll(' ', '_'), kmlContent: kml);
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path)],
        subject: 'GPS Tracking: $name',
        text: 'GPS track exported from WHO GIS Surveillance',
      ),
    );
  }
}
