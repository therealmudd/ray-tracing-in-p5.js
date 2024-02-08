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
