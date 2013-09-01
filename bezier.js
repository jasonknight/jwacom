var Vector = function (x,y) {
	var self = this;
	this.x = x;
	this.y = y;
	this.is = function () {
		return "Vector2D";
	}
	this.add = function (b) {
		var a = self;
		var c = new Vector();
		c.x = a.x + b.x;
		c.y = a.y + b.y;
		return c;
	};
	this.scale = function (s) {
		var result = new Vector();
		result.x = self.x * s;
		result.y = self.y * s;
		return result;
	};
	this.sub = function (b,a) {
		var a = self;
		var c = new Vector();
		c.x = a.x - b.x;
		c.y = a.y - b.y;
		return c;
	};
	this.length = function () {
		return Math.sqrt( self.x * self.x ) + (self.y * self.y);
	}
	this.normalize = function () {
		var dist = self.length();
		var res = new Vector(self.x,self.y);
		res.x = self.x * ( 1.0 / dist );
		res.y = self.y * ( 1.0 / dist );
		return self;
	};
	this.centerTangent = function ( vectors, center ) {
		if ( ! center ) {
			center = Math.floor( vectors.length / 2);
		}
		var tHatCenter = new Vector();
		var V1,V2;
		V1 = vectors[ center - 1].sub( vectors[ center ]);
		V2 = vectors[ center ].sub( vectors[ center + 1] );
		tHatCenter.x = (V1.x + V2.x) / 2.0;
		tHatCenter.y = (V1.y + V2.y) / 2.0;
		return tHatCenter.normalize();
	};
	this.rightTangent = function ( vectors, vend ) {
		if ( ! vend ) {
			vend = Math.floor( vectors.length / 2) + 1;
		}
		var tHatRight = vectors[ vend -1 ].sub( vectors[ vend ] );	
		return tHatRight.normalize();
	};
	this.leftTangent = function ( vectors, vend ) {
		if ( ! vend ) {
			vend = Math.floor( vectors.length / 2) + 1;
		}
		var tHatLeft = vectors[ vend + 1 ].sub( vectors[ vend ] );	
		return tHatLeft.normalize();
	};
	this.dot = function (b) {
		var a = self;
		return ( (a.x * b.x ) + ( a.y * b.y) );
	}
};
var Bezier = function () {
	var self = this;
	this.vectors = [];
	this.push = function ( vector ) {
		self.vectors.push(vector);
	};
	this.length = function () {
		return self.vectors.length;
	};
	this.at = function ( i ) {
		return self.vectors[i];
	}
} 
function B0(u) {
	var tmp = 1.0 - u;
	return ( tmp * tmp * tmp );
}
function B1(u) {
	var tmp = 1.0 - u;
	return ( 3 * u * ( tmp * tmp ) );
}
function B2(u) {
	var tmp = 1.0 - u;
	return ( 3 * u * u * tmp );
}
function B3(u) {
	return ( u * u * u );
}

function EvaluateBezier(degree, bezier, t) {
	var i,j;
	var Q = new Vector();
	var VTemp = [];
	var vectors;
	
	// Sometimes we just pass an array of vectors
	if ( ! bezier instanceof Array)
		vectors = bezier.vectors;
	else
		vectors = bezier;

	for ( i = 0; i < vectors.length; i++) {
		VTemp[i] = jQuery.extend({},true,vectors[i]);
	}
	for ( i = 1; i <= degree; i++ ) {
		for ( j = 0; j <= degree - 1; j++ ) {
			VTemp[j].x = ( 1.0 - t ) * VTemp[j].x + t * VTemp[ j + 1 ].x;
			VTemp[j].y = ( 1.0 - t ) * VTemp[j].y + t * VTemp[ j + 1 ].y;
		}
	}
	Q.x = VTemp[0].x;
	Q.y = VTemp[0].y;
	return Q;
}
function NewtonRaphsonRoot( bezier, P, u ) {
	var numerator, denominator, uPrime, i;
	var Q = bezier; // for simplicity
	var Q1 = [];
	var Q2 = [];
	var Q_u; // Vectors
	var Q1_u;
	var Q1_u;
	Q_u = EvaluateBezier(3, bezier, u);
	//Gen ctrl vertices for Q'
	for ( i = 0; i <= 2; i++ ) {
		Q1[i].x = ( Q[i+1].x - Q[i].x ) * 3.0;
		Q1[i].y = ( Q[i+1].y - Q[i].y ) * 3.0;
	}

	//Gen ctrl vertices for Q''
	for ( i = 0; i <= 1; i++ ) {
		Q2[i].x = ( Q1[i+1].x - Q1[i].x ) * 2.0;
		Q2[i].y = ( Q1[i+1].y - Q1[i].y ) * 2.0;
	}

	Q1_u = EvaluateBezier(2, Q1, u);
	Q2_u = EvaluateBezier(2, Q2, u);

	numerator = (Q_u.x - P.x) * (Q1_u.x) + (Q_u.y - P.y) * (Q1_u.y);
	denominator = (Q1_u.x) * (Q1_u.x) + (Q1_u.y) * (Q1_u.y) +
	      	  	  (Q_u.x - P.x) * (Q2_u.x) + (Q_u.y - P.y) * (Q2_u.y);

	if ( denominator == 0.0 ) { return u; }

	uPrime = u - ( numerator/denominator );
	return uPrime;
}
function Reparameterize( vectors, first, last, u, bezier ) {
	/*
	* vectors: list of vectors or points
	* first: index to the first part of the region
	* last: index to the last part of the region
	* u: current parameter values
	* bezier: the current bezier
	*/
	var i;
	var uPrime = [];
	for ( i = first; i <= last; i++ ) {
		uPrime[ i - first ] = NewtonRaphsonRoot( bezier, vectors[i], u[ i - first ]);
	}
	return uPrime;
}

function GenerateBezier( vectors, first, last, uPrime, tHat1, tHat2 ) {
	/*  vectors: Array of digitized points
	*  first/last: Indices defining region	
	*  uPrime: Parameter values for region 
	*  tHat1/tHat2: Unit tangents at endpoints	
	*/
	var i;
	var d = vectors; // to simplify;
	var A = []; // Precomputed rhs for eqn
	var nPts;
	var C = [[0,0],[0,0]]; // Matrix C
	var X = [0,0];
	var det_C0_C1, det_C0_X, det_X_C1;
	var alpha_l, alpha_r;
	var tmp = new Vector();

	var bezier = new Bezier();

	nPts = last - first + 1;

	for ( i = 0; i < nPts; i++ ) {
		var v1,v2;
		v1 = tHat1.scale( B1( uPrime[i] ) );
		v2 = tHat2.scale( B2( uPrime[i] ) );
		A[i][0] = v1;
		A[i][1] = v2;
	}
	/* Create the C and X matrices	*/
	C[0][0] = 0.0;
	C[0][1] = 0.0;
	C[1][0] = 0.0;
	C[1][1] = 0.0;
	X[0]    = 0.0;
	X[1]    = 0.0;
	for ( i = 0; i < nPts; i++ ) {
		C[0][0] += A[i][0].dot( A[i][0] );
		C[0][1] += A[i][0].dot( A[i][1] );

		C[1][0] = C[0][1];
		C[1][1] += A[i][1].dot( A[i][1] );

		tmp = d[first + i].sub(
			d[first].scale( B0(uPrime[i]) ).add(
				d[first].scale( B1(uPrime[i]) ).add(
					d[last].scale( B2(uPrime[i]) ).add(
						d[last].scale( B3(uPrime[i]) )
					)
				)
			)
		);


		X[0] += A[i][0].dot( tmp); 
		X[1] += A[i][1].dot( tmp );
	}
	/* Compute the determinants of C and X	*/
    det_C0_C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
    det_C0_X  = C[0][0] * X[1]    - C[1][0] * X[0];
    det_X_C1  = X[0]    * C[1][1] - X[1]    * C[0][1];
    /* Finally, derive alpha values	*/
    alpha_l = (det_C0_C1 == 0) ? 0.0 : det_X_C1 / det_C0_C1;
    alpha_r = (det_C0_C1 == 0) ? 0.0 : det_C0_X / det_C0_C1;
}