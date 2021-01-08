const { createCanvas, loadImage, Image } = require('canvas')
const fs = require("fs");




 class Placcard {


    constructor(canvasWidth, canvasHeight){

        this.canvas= createCanvas(canvasWidth, canvasHeight);
        this.ctx= this.canvas.getContext('2d');
        this.ctx.textBaseline="top";

        this.placements= [];
        
        
    }


    


    async load(JSONPATH){

      this.placements.length=0;
      let data= fs.readFileSync(JSONPATH);
      let instructions= JSON.parse(data);
      this.BoundingBox= instructions.BoundingBox;

      for(let Protoplacement of instructions.Sequence){

        
        switch(Protoplacement.Type){


          case ("background") : await this.placeBackGround(Protoplacement.Path); break;
          case ("text") : await this.placeText(Protoplacement.MaxFont, Protoplacement.MinFont, Protoplacement.squareX,Protoplacement.squareY,Protoplacement.squarewidth, Protoplacement.squareheight, Protoplacement.enteredString, Protoplacement.rotation); break;
        }
      }


    }

    placeBackGround(BackgroundPath){

        let placement= {Type: "background"};


        placement.squareX= 0;

        placement.squareY= 0;

        placement.location= BackgroundPath;


        this.placements.push(placement);



    }


    placeImage(squareX, squareY, Imagepath){


      placement= {Type: "image"}

      placement.squareX= squareX;

      placement.squareY= squareY;


      placement.location= Imagepath;


      this.placements.push(placement);


    }

    placeText(Maxfont, minfont, squareX, squareY, squarewidth, squareheight, enteredString, rotation){

        


            

            this.ctx.textBaseline="top";

            let currentFont= Maxfont;
            while(currentFont>minfont){

                this.ctx.font = currentFont+"px Arial";

                let tokenArray= enteredString.split(/[ ]+/);


                 let lines= [];


                let currentToken="";

                while(tokenArray.length>0){

        

                    let token= tokenArray.shift();
          
                    let temp=currentToken+" "+token;
                    
          
                    let currentlinewidth= this.ctx.measureText(temp.trim()).width;
          
                    if(currentlinewidth<= squarewidth) currentToken=temp.trim();
          
                    else if(currentToken.length>0) {
          
                      
          
                      lines.push(currentToken);
                      
                      tokenArray.unshift(token);
          
                      currentToken= "";
          
                    }
          
                    else{
          
                      
          
                      let front= token;
                      let back= "";
          
                      
          
                      while(currentlinewidth>squarewidth){
          
          
                          back= front.charAt(front.length-1) +back;
          
                          front = front.slice(0, -1);
          
                          currentlinewidth= this.ctx.measureText(front).width;
          
                          
          
                      }
          
                      lines.push(front);
          
                      tokenArray.unshift(back);
          
                      currentToken= "";
                    }
                }

                if(currentToken.length>0) lines.push(currentToken)


                let linelenthGlobal=0;

                let currentBoxheight=squareY;

                

                

                for(let line of lines){

                    
          
                  let linelength= this.ctx.measureText(line).width;
          
          
                  if(linelength>linelenthGlobal) linelenthGlobal= linelength;
          
                  currentBoxheight+=this.ctx.measureText(line).emHeightAscent;
                  currentBoxheight+=this.ctx.measureText(line).emHeightDescent;
          
                }
              
          
                if(currentBoxheight- squareY<=squareheight) {
          
                    let  placement={Type: "text"};

                     placement.topOffset=squareY+ (squareheight -(currentBoxheight-squareY))/2;
                     placement.sideOffset=squareX+ (squarewidth-linelenthGlobal)/2;

                     placement.font= this.ctx.font;

                     placement.lines= lines;

                     placement.squareX= squareX;
                     placement.squareY= squareY;
                     placement.squareWidth= squarewidth;
                     placement.squareHeight= squareheight;
                     placement.rotation= rotation;

                     this.placements.push(placement);


                     break;
                     
                      
          
                }
          
                else{
          
                  currentFont--;
                }


            }



       





    }

    drawImage(placementObj){

      loadImage(placementObj.location).then((image)=>{


        this.ctx.drawImage(image, placementObj.squareX, placementObj.squareY);

      })

    }

   

    drawText(placementObj){

     

        this.ctx.save();

        let currentBoxheight=placementObj.topOffset;

        this.ctx.font= placementObj.font;

         let cX= placementObj.squareX+ placementObj.squareWidth/2;
         let cY= placementObj.squareY+placementObj.squareHeight/2;

         
    
         this.ctx.translate(cX, cY)
    
         this.ctx.rotate( (Math.PI / 180) * placementObj.rotation);

        
    
         this.ctx.translate(-cX, -cY)


        for(let line of placementObj.lines){

            
            this.ctx.fillText(line, placementObj.sideOffset, currentBoxheight);

            currentBoxheight+=this.ctx.measureText(line).emHeightAscent;
            currentBoxheight+=this.ctx.measureText(line).emHeightDescent;

          }

          if(this.BoundingBox){

            this.ctx.beginPath();
        this.ctx.rect(placementObj.squareX, placementObj.squareY, placementObj.squareWidth, placementObj.squareHeight);
           this.ctx.stroke();


          }
        
          



        this.ctx.restore();

    }

    async render(outputPath){


      for(let placement of this.placements){

        
        switch(placement.Type){


          case 'background' : await this.drawImage(placement); break;

          case 'text' : await this.drawText(placement); break;
        }


      }


      let buff= await this.canvas.toBuffer();

       await fs.writeFileSync(outputPath, buff);
    }

}

const placcardInstance= new Placcard(1200, 630);



async  function pTest(){

  ///////////////////

        await placcardInstance.load('./placcardData.json');

       
        await placcardInstance.render('./test2.png');


        


}

pTest();



module.exports= Placcard;