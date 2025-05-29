<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <!-- Theme initialization script - placed in head to avoid flash of incorrect theme -->
    <script>
        (function () {
          try {
            const saved = localStorage.getItem('appearance') || 'system';
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = saved === 'dark' || (saved === 'system' && prefersDark);
            document.documentElement.classList.toggle('dark', isDark);
          } catch (e) {
            console.error('Failed to initialize theme:', e);
          }
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/js/app.jsx', 'resources/css/app.css'])
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
          integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
          crossorigin=""/>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <script>
      window.googleMapsApiKey = "{{ config('services.google_maps.api_key') }}";
    </script>
    @inertiaHead
</head>
<body>
    @inertia
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"
    integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
    crossorigin=""></script>
</body>
</html>