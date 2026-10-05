# Realistic Globe

An interactive CSS 3D globe (drag to rotate, scroll to zoom). Concept credit: Edan Kwan.
No external scripts, everything runs from this repo.

## Folder structure

```
index.html
css/style.css
js/perspective-transform.js
js/globe.js
assets/globe_bg.jpg        <- you must add
assets/globe_diffuse.jpg   <- you must add (required)
assets/globe_halo.png      <- you must add
```

## Step 1: add the 3 images to `assets/`

Download these (open each link in your browser and Save As, or use curl) and save with EXACTLY these names:

```
curl -L -o assets/globe_bg.jpg      https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_bg.jpg
curl -L -o assets/globe_diffuse.jpg https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_diffuse.jpg
curl -L -o assets/globe_halo.png    https://s3-us-west-2.amazonaws.com/s.cdpn.io/6043/css_globe_halo.png
```

## Step 2: test locally

Open `index.html`, or run `python -m http.server` in this folder and visit http://localhost:8000

## Step 3: publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder (keep the folder structure).
3. Repo Settings > Pages > Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`, Save.
4. After a minute your site is live at `https://<username>.github.io/<repo-name>/`.

## Later changes

`GlobeApp.goTo(lat, lng)` and `GlobeApp.config` are available in the browser console for quick experiments.
