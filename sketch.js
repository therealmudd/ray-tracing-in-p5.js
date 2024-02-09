// Ray Tracing In p5.js
// https://editor.p5js.org/Mudd/sketches/bfTSHU48-

// Inspired by: 
// Ray Tracing in One Weekend
// https://raytracing.github.io/books/RayTracingInOneWeekend.html

var cam;
var world;

function setup() {  
  
  world = new HittableList();
  
  const material_ground = new Lambertian(new p5.Vector(0.8, 0.8, 0.0));
  const material_center = new Lambertian(new p5.Vector(0.7, 0.3, 0.3));
  const material_left = new Metal(new p5.Vector(0.8, 0.8, 0.8));
  const material_right = new Metal(new p5.Vector(0.8, 0.6, 0.2));
  
  world.add(new Sphere(new p5.Vector( 0.0, -100.5, -1.0), 100.0, material_ground));
  world.add(new Sphere(new p5.Vector( 0.0,    0.0, -1.0),   0.5, material_center));
  world.add(new Sphere(new p5.Vector(-1.0,    0.0, -1.0),   0.5, material_left));
  world.add(new Sphere(new p5.Vector( 1.0,    0.0, -1.0),   0.5, material_right));
  
  cam = new Camera();
  
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

function reflect(v, n){
  return p5.Vector.sub(
    v,
    p5.Vector.mult(n, 2*p5.Vector.dot(v, n))
  );
}

function is_near_zero(v){
  const s = 1e-8;
  return (abs(v.x) < s) && (abs(v.y) < s) && (abs(v.z) < s);
}