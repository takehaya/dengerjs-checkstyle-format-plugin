'use strict';
/*
 * Generates a Markdown table
 * @param {string[]} base_path
 * @param {string[][]} report
 * let c = new checkStyle(__dirname)
 * c.report("your current dir")
*/
var fs = require('fs');
var parseString = require('xml2js').parseString;

Object.defineProperty(Array.prototype, 'flatMap', {
    value: function (f, self) {
      self = self || this;
      return this.reduce(function (ys, x) {
        return ys.concat(f.call(self, x));
      }, []);
    },
    enumerable: false,
  });
 class checkStyle{
    constructor(base_path){
        this.base_path = base_path|| ""
        if (base_path.length <= 1){
            throw new Error(
                '[danger-checkStyle] whitelist option has to be an array.',
              )
        }      
    }
    report(checkstyle_file, inline_mode = true){
        console.log(checkstyle_file);
        if (this.isExistFile(checkstyle_file)){
            try {
                let file = fs.readFileSync(checkstyle_file, 'utf-8');
                this.send_comment(this.parse(file), inline_mode)
            } catch (error) {
                console.log(error);
                throw new Error(`No checkstyle file was found at${checkstyle_file}`)
            }
        }else{
            throw new Error('Please specify file name')
        }

    }
    report_by_text(checkstyle_text, inline_mode = true){
        if (Boolean(checkstyle_text)){
            this.send_comment(this.parse(checkstyle_text), inline_mode)
        }else{
            throw new Error('Please specify xml text.')
        }

    }
    parse(text_xml){
        let parsedatas;
        parseString(text_xml,  (err, result)=>(
            parsedatas = result["checkstyle"].file
        ));
        let base_path_suffix = this.base_path.slice(-1) === "/" ? "":"/"
        let path = this.base_path + base_path_suffix
        let element=[];
        for (const parsedata of parsedatas) {
            let error = parsedata['error'][0]['$']
            element.push(new CheckstyleError(error, parsedata['$'], path))
        }

        //TODO::mapで書き直す
        // let element = parsedata.flatMap((parent)=>{
        //     parsedata.map((child)=>{
        //         return CheckstyleError(child, parent, base_path)
        //     })
        // });
        return element

    }
    
    send_comment(errors, inline_mode){
        if(inline_mode){ 
            this.send_inline_comment(errors);
        }else{
            throw new Error('not implemented.');
        }
    }

    send_inline_comment(errors){
        // errors.map(err=>console.log(err.message, err.file_name, err.line))
        errors.map(err => warn(err.message, err.file_name, err.line))
    }

    isExistFile(file){
        try {
          fs.statSync(file);
          return true
        } catch(err) {
          if(err.code === 'ENOENT') return false
        }
    }
}

class CheckstyleError{
    constructor(node, parent_node, base_path){
        this.file_name = parent_node["name"].replace(base_path,"")
        this.column = node["column"] === null ? null : parseInt(node["column"]);
        this.message =  node["message"];
        this.line = parseInt(node["line"]);
        this.severity =  node["severity"];
        this.source = node["source"];
    }
}

