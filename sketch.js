// Ray Tracing In p5.js
// https://editor.p5js.org/Mudd/sketches/bfTSHU48-

// Inspired by: 
// Ray Tracing in One Weekend
// https://raytracing.github.io/books/RayTracingInOneWeekend.html

const aspect_ratio = 16 / 9;
const image_width = 400;

// Calculate the image_height, and ensure that it's at least 1
var image_height = Math.floor(image_width / aspect_ratio);
image_height = (image_height < 1) ? 1: image_height;

// World

const world = new HittableList();

world.add(new Sphere(new p5.Vector(0, 0, -1), 0.5));
world.add(new Sphere(new p5.Vector(0, -100.5, -1), 100));

// Camera

const focal_length = 1.0;
const viewport_height = 2.0;
const viewport_width = viewport_height * (image_width / image_height);
const camera_center = new p5.Vector(0, 0, 0);

// Calulate the vectors across the horizontal and down the vertical viewport edges
const viewport_u = new p5.Vector(viewport_width, 0, 0);
const viewport_v = new p5.Vector(0, -viewport_height, 0);

// Calculate the horizontal and vertical delta vectors from pixel to pixel
const pixel_delta_u = p5.Vector.div(viewport_u, image_width);
const pixel_delta_v = p5.Vector.div(viewport_v, image_height);

// Calculate the location of the upper left pixel
const viewport_upper_left = subVecs(
  camera_center,
  new p5.Vector(0, 0, focal_length),
  p5.Vector.div(viewport_u, 2),
  p5.Vector.div(viewport_v, 2)
);

const pixel00_loc = p5.Vector.add(
  viewport_upper_left, 
  p5.Vector.mult( p5.Vector.add(pixel_delta_u, pixel_delta_v), 0.5 )
);

// Render

function setup() {  
  
  createCanvas(image_width, image_height);
  
  pixelDensity(1);
  loadPixels();
  for (let j = 0; j < image_height; j ++){
    for (let i = 0; i < image_width; i ++){

      let pixel_center = addVecs(
        pixel00_loc, 
        p5.Vector.mult(pixel_delta_u, i),
        p5.Vector.mult(pixel_delta_v, j)
      );
      
      let ray_direction = p5.Vector.sub(pixel_center, camera_center);
      
      let r = new Ray(camera_center, ray_direction);
      
      let pixel_color = ray_color(r, world);
      
      let index = (j * width + i) * 4;
      pixels[index + 0] = pixel_color.x * 255;
      pixels[index + 1] = pixel_color.y * 255;
      pixels[index + 2] = pixel_color.z * 255;
      pixels[index + 3] = 255;
    }
  }
  updatePixels();
  
}

// function draw() {
// }

function ray_color(r, world){
  let rec = world.hit(r);
  if (rec.hitAnything){
    return p5.Vector.mult(
      p5.Vector.add(rec.nrml, new p5.Vector(1, 1, 1)),
      0.5
    );
  }
  
  let unit_direction = p5.Vector.normalize(r.direction);
  let a = 0.5 * (unit_direction.y + 1);
  return p5.Vector.lerp(
    new p5.Vector(1.0, 1.0, 1.0),
    new p5.Vector(0.5, 0.7, 1.0), 
    a
  );
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