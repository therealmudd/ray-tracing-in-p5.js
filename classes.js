class Camera{
  constructor(){
    this.aspect_ratio = 1.0; // Ratio of image width over height
    this.image_width = 100; // Rendered image width in pixel count
    this.samples_per_pixel = 10; // Count of random samples for each pixel
    this.max_depth = 5; // Maximum number of ray bounces into scene
    
    this.aspect_ratio = 16 / 9;
    this.image_width = 400;

    // Calculate the image_height, and ensure that it's at least 1
    this.image_height = Math.floor(this.image_width / this.aspect_ratio);
    this.image_height = (this.image_height < 1) ? 1: this.image_height;

    this.focal_length = 1.0;
    this.viewport_height = 2.0;
    this.viewport_width = this.viewport_height * (this.image_width / this.image_height);
    this.center = new p5.Vector(0, 0, 0);
  }
  
  initialize(){
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
    
    createCanvas(this.image_width, this.image_height);
  }
  
  render(world){
    
    this.initialize();

    pixelDensity(1);
    loadPixels();
    for (let j = 0; j < this.image_height; j ++){
      for (let i = 0; i < this.image_width; i ++){
        
        let pixel_color = new p5.Vector(0, 0, 0);
        for (let sample = 0; sample < this.samples_per_pixel; sample++){
          let r = this.get_ray(i, j);
          pixel_color.add(this.ray_color(r, this.max_depth, world));
        }
        
        let scl = 1.0 / this.samples_per_pixel;

        let index = (j * width + i) * 4;
        pixels[index + 0] = sqrt(pixel_color.x * scl) * 255;
        pixels[index + 1] = sqrt(pixel_color.y * scl) * 255;
        pixels[index + 2] = sqrt(pixel_color.z * scl) * 255;
        pixels[index + 3] = 255;
      }
    }
    updatePixels();
  }
  
  ray_color(r, depth, world){
    if (depth <= 0) return new p5.Vector(0, 0, 0);
    
    let rec = world.hit(r);
    
    if (rec.hitAnything){
      let scattered = rec.material.scatter(r, rec);
      if (scattered){
        let attenuation = rec.material.attenuation;
        return p5.Vector.mult(attenuation, this.ray_color(scattered, depth-1, world));
      }
      return new p5.Vector(0, 0, 0);
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
    this.material = null;
  }
  
  set_face_normal(r, outward_normal){
    this.front_face = p5.Vector.dot(r.direction, outward_normal) < 0;
    this.nrml = this.front_face ? outward_normal : p5.Vector.mult(outward_normal, -1);
  }
}

class Lambertian{
  constructor(a){
    this.albedo = a;
    this.attenuation = this.albedo;
  }
  
  scatter(r_in, rec){
    let scatter_direction = p5.Vector.add(rec.nrml, random_unit_vector());
    
    if (is_near_zero(scatter_direction)){
      scatter_direction = rec.nrml;
    }
    
    let scattered = new Ray(rec.p, scatter_direction);
    this.attenuation = this.albedo;
    return scattered;
  }
}

class Metal{
  constructor(a, f){
    this.albedo = a;
    this.fuzz = f < 1 ? f : 1;
    this.attenuation = this.albedo;
  }
  
  scatter(r_in, rec){
    let reflected = reflect(r_in.direction, rec.nrml);
    let direction = p5.Vector.add(
      p5.Vector.add(reflected, p5.Vector.mult(random_unit_vector(), self.fuzz))
    );
    this.attenuation = this.albedo;
    let scattered = new Ray(rec.p, direction);
    if (p5.Vector.dot(scattered.direction, rec.nrml) > 0){
      return scattered;
    }
  }
  
}

class Sphere{
  constructor(center, radius, material){
    this.center = center;
    this.radius = radius;
    this.material = material;
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
      
      if (dst >= 0.001){
        rec.hitAnything = true;
        rec.t = dst;
        rec.p = r.at(rec.t);
        let outward_nrml = p5.Vector.normalize(
          p5.Vector.sub(rec.p, this.center)
        );
        rec.set_face_normal(r, outward_nrml);
        rec.material = this.material;
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
