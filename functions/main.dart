import 'dart:async';
import 'dart:io';

extension ListExtension on List<String> {
  bool matchesScheme(String scheme) {
    if (this.isEmpty) return false;
    for (final item in this) {
      if (scheme.contains(item)) {
        return true;
      }
    }
    return false;
  }
}

Future<dynamic> main(final context) async {
  final schemeFromEnv = Platform.environment['APP_SCHEME'];

  final validSchemes = ['localhost', '192.168.1.2'];
  if (schemeFromEnv != null) {
    validSchemes.add(schemeFromEnv);
  }

  if (context.req.method == 'GET') {
    final path = context.req.path as String;
    context.log('Path: $path');

    // Handle Password Reset
    if (path.contains('/reset-password')) {
      final queryParams = context.req.query as Map<String, dynamic>;
      if (queryParams.isEmpty) {
        return context.res.send('No Query Params', 400, {
          'content-type': 'text/plain',
        });
      }

      final scheme = queryParams['scheme'] as String?;
      final secret = queryParams['secret'] as String?;
      final userId = queryParams['userId'] as String?;
      final expire = queryParams['expire'] as String?;
      if (scheme == null || secret == null || userId == null || expire == null) {
        context.log('Missing Query Params: {scheme: $scheme, secret: $secret, userId: $userId, expire: $expire}');
        return context.res.send('Missing Query Params', 400, {
          'content-type': 'text/plain',
        });
      }

      final decodedScheme = Uri.decodeComponent(scheme);

      if (!validSchemes.matchesScheme(decodedScheme)) {
        context.log('Invalid Scheme: $decodedScheme');
        return context.res.send('Invalid Scheme. If it\'s correct, add it in your function environment.', 400, {
          'content-type': 'text/plain',
        });
      }

      return context.res.redirect(
        '${decodedScheme}reset-password?secret=$secret&userId=$userId&expire=$expire',
        301,
      );
    }

    // Handle Email Verification
    if (path.contains('/verify')) {
      final queryParams = context.req.query as Map<String, dynamic>;
      if (queryParams.isEmpty) {
        return context.res.send('No Query Params', 400, {
          'content-type': 'text/plain',
        });
      }

      final scheme = queryParams['scheme'] as String?;
      final secret = queryParams['secret'] as String?;
      final userId = queryParams['userId'] as String?;

      if (scheme == null || secret == null || userId == null) {
        context.log('Missing Query Params: {scheme: $scheme, secret: $secret, userId: $userId}');
        return context.res.send('Missing Query Params', 400, {
          'content-type': 'text/plain',
        });
      }

      final decodedScheme = Uri.decodeComponent(scheme);

      if (!validSchemes.matchesScheme(decodedScheme)) {
        context.log('Invalid Scheme: $decodedScheme');
        return context.res.send('Invalid Scheme. Add it to your environment.', 400, {
          'content-type': 'text/plain',
        });
      }

      return context.res.redirect(
        '${decodedScheme}verify?secret=$secret&userId=$userId',
        301,
      );
    }

    return context.res.send('Nothing to redirect to ;)', 204, {
      'content-type': 'text/plain',
    });
  } else {
    final method = context.req.method as String;
    context.res.error('Method Not Allowed: $method', 405);
    return context.res.send('$method Method Not Allowed', 405, {
      'content-type': 'text/plain',
    });
  }
}
