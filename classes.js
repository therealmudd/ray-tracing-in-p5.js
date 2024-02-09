class Camera{
  constructor(){
    this.aspect_ratio = 1.0; // Ratio of image width over height
    this.image_width = 100; // Rendered image width in pixel count
    this.samples_per_pixel = 40; // Count of random samples for each pixel
  }
  
  initialize(){
    
    this.aspect_ratio = 16 / 9;
    this.image_width = 400;

    // Calculate the image_height, and ensure that it's at least 1
    this.image_height = Math.floor(this.image_width / this.aspect_ratio);
    this.image_height = (this.image_height < 1) ? 1: this.image_height;

    this.focal_length = 1.0;
    this.viewport_height = 2.0;
    this.viewport_width = this.viewport_height * (this.image_width / this.image_height);
    this.center = new p5.Vector(0, 0, 0);

    // Calulate the vectors across the horizontal and down the vertical viewport edges
    this.viewport_u = new p5.Vector(this.viewport_width, 0, 0);
    this.viewport_v = new p5.Vector(0, -this.viewport_height, 0);

    // Calculate the horizontal and vertical delta vectors from pixel to pixel
    this.pixel_delta_u = p5.Vector.div(this.viewport_u, this.image_width);
    this.pixel_delta_v = p5.Vector.div(this.viewport_v, this.image_height);

    // Calculate the location of the upper left pixel
    this.viewport_upper_left = subVecs(
      this.center,
      new p5.Vector(0, 0, this.focal_length),
      p5.Vector.div(this.viewport_u, 2),
      p5.Vector.div(this.viewport_v, 2)
    );

    this.pixel00_loc = p5.Vector.add(
      this.viewport_upper_left, 
      p5.Vector.mult( p5.Vector.add(this.pixel_delta_u, this.pixel_delta_v), 0.5 )
    );
  }
  
  render(world){
    this.initialize();
    
    createCanvas(this.image_width, this.image_height);

    pixelDensity(1);
    loadPixels();
    for (let j = 0; j < this.image_height; j ++){
      for (let i = 0; i < this.image_width; i ++){
        
        let pixel_color = new p5.Vector(0, 0, 0);
        for (let sample = 0; sample < this.samples_per_pixel; sample++){
          let r = this.get_ray(i, j);
          pixel_color.add(this.ray_color(r, world));
        }
        
        let scl = 1.0 / this.samples_per_pixel;

        let index = (j * width + i) * 4;
        pixels[index + 0] = pixel_color.x * 255 * scl;
        pixels[index + 1] = pixel_color.y * 255 * scl;
        pixels[index + 2] = pixel_color.z * 255 * scl;
        pixels[index + 3] = 255;
      }
    }
    updatePixels();
  }
  
  ray_color(r, world){
    let rec = world.hit(r);
    if (rec.hitAnything){
      let direction = random_on_hemisphere(rec.nrml);
      
      return p5.Vector.mult(
        this.ray_color(new Ray(rec.p, direction), world),
        0.5
      );
      
      // return p5.Vector.mult(
      //   p5.Vector.add(rec.nrml, new p5.Vector(1, 1, 1)),
      //   0.5
      // );
    }

    let unit_direction = p5.Vector.normalize(r.direction);
    let a = 0.5 * (unit_direction.y + 1);
    return p5.Vector.lerp(
      new p5.Vector(1.0, 1.0, 1.0),
      new p5.Vector(0.5, 0.7, 1.0), 
      a
    );
  }
  
  get_ray(i, j){
    // Get a randomly sampled camera ray for the pixel at location i, j
    
    let pixel_center = addVecs(
          this.pixel00_loc, 
          p5.Vector.mult(this.pixel_delta_u, i),
          p5.Vector.mult(this.pixel_delta_v, j)
    );
    let pixel_sample = p5.Vector.add(pixel_center, this.pixel_sample_square());
    
    let ray_origin = this.center;
    let ray_direction = p5.Vector.sub(pixel_sample, ray_origin);
    
    return new Ray(ray_origin, ray_direction);
  }
  
  pixel_sample_square(){
    // Returns a random point in the square surrounding a pixel at the origin
    let px = -0.5 + random();
    let py = -0.5 + random();
    return p5.Vector.add(
      p5.Vector.mult(this.pixel_delta_u, px),
      p5.Vector.mult(this.pixel_delta_v, py)
    );
  }
}

class Ray{
  constructor(orig, dir){
    this.origin = orig;
    this.direction = dir;
  }
  
  at(t){
    return p5.Vector.add(
      this.origin, 
      p5.Vector.mult(this.direction, t)
    );
  }
}

class HitRecord{
  constructor(p, nrml, t){
    this.p = p;
    this.nrml = nrml;
    this.t = t;
    this.front_face = null;
    this.hitAnything = false;
  }
  
  set_face_normal(r, outward_normal){
    this.front_face = p5.Vector.dot(r.direction, outward_normal) < 0;
    this.nrml = this.front_face ? outward_normal : p5.Vector.mult(outward_normal, -1);
  }
}

class Sphere{
  constructor(center, radius){
    this.center = center;
    this.radius = radius;
  }
  
  hit(r){
    let rec = new HitRecord();
    
    let oc = p5.Vector.sub(r.origin, this.center);
    let a = p5.Vector.dot(r.direction, r.direction);
    let b = 2 * p5.Vector.dot(oc, r.direction);
    let c = p5.Vector.dot(oc, oc) - this.radius*this.radius;
    let delta = b*b - 4*a*c;
    
    if (delta >= 0){
      let dst = ( -b - sqrt(delta) ) / (2*a);
      
      if (dst >= 0){
        rec.hitAnything = true;
        rec.t = dst;
        rec.p = r.at(rec.t);
        let outward_nrml = p5.Vector.normalize(
          p5.Vector.sub(rec.p, this.center)
        );
        rec.set_face_normal(r, outward_nrml);
      }
    }
  
    return rec;
  }
}

class HittableList {
  constructor(){
    this.objects = [];
  }
  
  add(object){
    this.objects.push(object);
  }
  
  hit(r){
    let closest_rec = new HitRecord();
    closest_rec.t = Infinity;
    
    for (let object of this.objects){
      let rec = object.hit(r);
      if (rec.hitAnything && rec.t < closest_rec.t){
        closest_rec = rec;
      }
    }
    return closest_rec;
  }
}
