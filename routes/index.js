var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var multer = require('multer');
const path = require('path');
var app = require('../app');


const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
  }),
});
var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '111111',
  port : '3306',
  database : 'faceclone'
});
// 좋아요 누른사람의 배열
var like_array = [];

connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 회원목록 가져오기
  if(req.session.user_session_id) {
    res.redirect('/login');
  } else {
    connection.query('SELECT * FROM faceclone_recent_login ORDER BY date DESC LIMIT 3;',(err , rows , fields) => {
      if(!err) {
        res.render('login',{users:rows});
      } else {
        console.log(err);
      }
    })
  }
});

router.post('/login',(req,res) => {

  // 로그인처리
  connection.query(`SELECT c.post_id , c.user_name, c.user_comment , c.user_date FROM  faceclone_comment AS c  LEFT JOIN faceclone_post AS p ON p.id = c.post_id ORDER BY post_id DESC;`,(error , row2 , field2) => {
    connection.query(`SELECT * FROM faceclone_post ORDER BY id desc;`,(error , row1 , field1) => {
      connection.query(`SELECT * FROM faceclone_users WHERE phone_or_email = '${req.body.user_name}' AND pw = '${req.body.user_pw}';`,(err , rows, fields) => {
        connection.query(`SELECT * FROM faceclone_story ORDER BY id DESC LIMIT 3;`,(err , story_rows , story_fields) => {
          if(!req.session.user_session_id) {
            if(rows.length > 0) {
              req.session.user_session_id = rows[0].phone_or_email;
              connection.query(`INSERT INTO faceclone_recent_login(name,recent_id,gender) VALUES ('${rows[0].first_name}${rows[0].last_name}','${rows[0].id}','${rows[0].gender}');`,(err , rows, fields) => {
                if(err) {
                  return;
                }
              });
            
              res.render('home',{user:rows,post:row1,comment:row2,story:story_rows});} else {
              res.render('location');
            }
          } else {
            res.render('home',{user:rows,post:row1,comment:row2,story:story_rows});
          }
        })
      })
    })
  });
})

router.get('/login',(req, res) => {

  connection.query(`SELECT c.post_id , c.user_name, c.user_comment , c.user_date FROM  faceclone_comment AS c  LEFT JOIN faceclone_post AS p ON p.id = c.post_id ORDER BY post_id DESC;`,(error , row2 , field2) => {
    connection.query(`SELECT * FROM faceclone_post ORDER BY id desc;`,(error , row1 , field1) => {
      connection.query(`SELECT * FROM faceclone_users WHERE phone_or_email = '${req.session.user_session_id}';`,(err , rows, fields) => {
        connection.query(`SELECT * FROM faceclone_story ORDER BY id DESC LIMIT 3;`,(err , story_rows , story_fields) => {
          if(req.session.comment_link) {
            res.render('home',{user:rows,post:row1,comment:row2,comment_link:req.session.comment_link,story:story_rows});
          } else {
            // 첫 로그인 외에 로그인이 되었을 때
            res.render('home',{user:rows,post:row1,comment:row2,comment_link:0,story:story_rows});
          }
        });
      });
    });
  });
});

router.post('/register',(req,res) => {
  // 회원가입 처리
  connection.query(`INSERT INTO faceclone_users(first_name,last_name,phone_or_email,pw,birth_year,birth_month,birth_day,gender) VALUES ('${req.body.first_name}','${req.body.last_name}','${req.body.phone_or_email}','${req.body.pw}','${req.body.birth_year}','${req.body.birth_month}','${req.body.birth_day}','${req.body.gender}');`,(err , rows , fields) => {
    if(!err) {
      console.log('회원정보 등록 완료');
      res.render('location');
    } else {
      console.log(err);
    }
  })
})

// 게시글 입력 처리
router.post('/posting',upload.single('post_image'),(req,res) => {

  // 만약 이미지 파일이 있는 게시글이라면,

  if(req.file) {
    console.log('이미지 있음!!');

    connection.query(`INSERT INTO faceclone_post(user_name,description,desc_image) VALUES ('${req.body.faceclone_user_name}','${req.body.desc}','/uploads/${req.file.filename}');`,(err , rows , fields) => {
      if(!err) {
        res.redirect('/login');
      }
    });
  } else {
    connection.query(`INSERT INTO faceclone_post(user_name,description) VALUES ('${req.body.faceclone_user_name}','${req.body.desc}');`,(err , rows , fields) => {
      if(!err) {
        res.redirect('/login');
      }
    });
  }
})

// 게시글 좋아요 처리
router.post('/like',(req,res) => {
  connection.query(`UPDATE faceclone_post SET like_count = like_count + 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
    console.log('좋아요 눌러줌');
  });
})

// 게시글 좋아요 취소 처리
router.post('/unlike',(req,res) => {
  connection.query(`UPDATE faceclone_post SET like_count = like_count - 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
    console.log('좋아요 취소 눌러줌');
  });
})

// 댓글 작성 처리
router.post('/comment',(req,res) => {
  connection.query(`INSERT INTO faceclone_comment (user_name,user_comment,post_id) VALUES ('${req.body.user_name}','${req.body.writing_comment}','${req.body.post_num}')`,(err , rows , fields) => {
    
  });
  res.redirect('/login');
})

// 상단에서 김우빈 프로필을 클릭한 경우
router.post('/up', upload.single('img'), (req, res) => {
  console.log(req.file); 
});

// 상단에서 스토리에 게시를 체크한 경우
router.post('/story',upload.single('story_image') ,(req,res) => {
  if(req.file) {
    connection.query(`INSERT INTO faceclone_story (description,user_name) VALUES ('/uploads/${req.file.filename}','${req.body.korea_name}')`,(err, rows , fields) => {

    });
    res.redirect('/login');
  } else {
    res.send('파일 안들어옴');
  }
  
});

// 스토리를 누른 경우
router.post('/story_home', (req,res) => {
  connection.query(`SELECT * FROM faceclone_story` , (err , row , fields) => {
    res.render('story',{story:row});
  });
})


module.exports = router;
