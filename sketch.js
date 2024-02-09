// Ray Tracing In p5.js
// https://editor.p5js.org/Mudd/sketches/bfTSHU48-

// Inspired by: 
// Ray Tracing in One Weekend
// https://raytracing.github.io/books/RayTracingInOneWeekend.html


function setup() {  
  
  const world = new HittableList();

  world.add(new Sphere(new p5.Vector(0, 0, -1), 0.5));
  world.add(new Sphere(new p5.Vector(0, -100.5, -1), 100));
  
  const cam = new Camera();
  
  cam.aspect_ratio = 16.0 / 9.0;
  cam.image_width = 400;
  
  cam.render(world);
}

// Useful functions

function addVecs(...vecs){
  let result = vecs[0].copy();
  for (let vec of vecs.slice(1)){
    result.add(vec);
  }
  return result;
}

function subVecs(...vecs){
  let result = vecs[0].copy();
  for (let vec of vecs.slice(1)){
    result.sub(vec);
  }
  return result;
}

function random_in_unit_sphere(){
  while (true){
    let p = p5.Vector.random3D();
    if (p5.Vector.dot(p) < 1){
      return p;
    }  
  }
}

function random_unit_vector(){
  return p5.Vector.normalize(random_in_unit_sphere());
}

function random_on_hemisphere(nrml){
  let on_unit_sphere = random_unit_vector();
  if (p5.Vector.dot(on_unit_sphere, nrml) > 0.0) // In the same hemisphere as the normal
    return on_unit_sphere;
  else
    return p5.Vector.mult(on_unit_sphere, -1);
}