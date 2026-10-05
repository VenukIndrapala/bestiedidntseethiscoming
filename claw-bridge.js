/* Loads claw-machine.html into the globe page's "next scene" layer
   once the cube opens it. Needs claw-machine.html/.css/.js in the same folder. */
(() => {
  const scene = document.getElementById("nextScene");
  if (!scene) return;

  const style = document.createElement("style");
  style.textContent =
    ".next-scene iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#fff}";
  document.head.appendChild(style);

  const placeholder = scene.querySelector("p");
  if (placeholder) placeholder.remove();

  const frame = document.createElement("iframe");
  frame.title = "Claw machine game";
  scene.appendChild(frame);

  const load = () => {
    if (!frame.getAttribute("src")) frame.src = "claw-machine.html";
  };

  new MutationObserver(() => {
    if (scene.classList.contains("next-scene--on")) load();
  }).observe(scene, { attributes: true, attributeFilter: ["class"] });

  if (scene.classList.contains("next-scene--on")) load();
})();
